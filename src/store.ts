import {
  type ToRefs,
  type UnwrapRef,
  computed,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { compileFile, cssRE, transformTS } from './transform'
import { addEsmPrefix, atou, useRoutePath, useRouteQuery, utoa } from './utils'
import type { Organization, OutputModes, Project, User } from './types'
import type { editor } from 'monaco-editor-core'

import { defaultPresets } from './presets'
import { ofetch } from 'ofetch'
import {
  importMapFile,
  tsconfigFile,
  viteConfigFile,
  tsMacroConfigFile,
  indexHtmlFile,
  appFile,
} from './presets/index'

export {
  importMapFile,
  tsconfigFile,
  viteConfigFile,
  tsMacroConfigFile,
  indexHtmlFile,
  appFile,
}

export const configFileNames = [
  importMapFile,
  tsconfigFile,
  tsMacroConfigFile,
  viteConfigFile,
]

export async function useStore(
  {
    files = ref(Object.create(null)),
    activeFilename = useRouteQuery('main', appFile),
    activeConfigFilename = useRouteQuery('config', viteConfigFile),

    errors = ref([]),
    showOutput = ref(false),
    outputMode = useRouteQuery('output', 'js'),
    theme = ref('dark'),
    loading = ref(true),

    locale = ref(),
    typescriptVersion = ref('latest'),
    dependencyVersion = ref(Object.create(null)),
    reloadLanguageTools = ref(),

    preset = useRoutePath<string>('vue-jsx'),
    presets = ref(defaultPresets as any),
  }: Partial<StoreState> = {},
  serializedState?: string,
): Promise<ReplStore> {
  const organization = ref<Organization>()
  const organizations = ref<Organization[]>([])
  async function getOrganizations(name: string) {
    organizations.value = await ofetch(
      `https://api.github.com/users/${name}/orgs`,
    )
    const userName = preset.value.split('/')[0]
    organization.value = organizations.value.find((i) => i.login === userName)
  }

  const user = ref({} as User)
  if (document.cookie.split('; ').some((i) => /^token=\S+/.test(i))) {
    user.value = await ofetch('/api/user-info').catch(() => ({}))
    getOrganizations(user.value.name)
  }
  const userName = computed(() => organization.value?.login || user.value.name)

  const project = ref<Project>()
  const template = ref({} as Template)
  async function getTemplate() {
    if (presets.value[preset.value]) {
      project.value = undefined
      template.value = presets.value[preset.value]
    } else {
      project.value = await ofetch('/api/project/' + preset.value)
      if (!project.value) {
        preset.value = 'vue-jsx'
        template.value = presets.value['vue-jsx']
        return
      }
      serializedState ??= project.value.hash
      template.value = resolveHash(project.value?.hash ?? '')
    }
  }

  async function setDefaultFile() {
    loading.value = true
    await getTemplate()
    await setFiles(template.value)
    setTimeout(() => {
      loading.value = false
    }, 1000)
  }
  await setDefaultFile()

  async function init() {
    watch(preset, () => {
      activeFilename.value = appFile
      history.pushState(null, '', location.pathname + location.search)
      setDefaultFile()
    })

    await getViteConfig()

    watchEffect(() => {
      compileFile(store, activeFile.value).then((errs) => (errors.value = errs))
    })

    watchEffect(() => {
      compileFile(store, activeConfigFile.value).then(
        (errs) => (errors.value = errs),
      )
    })

    watch(
      () => [
        files.value[tsMacroConfigFile]?.code,
        files.value[tsconfigFile]?.code,
        typescriptVersion.value,
        locale.value,
        dependencyVersion.value,
      ],
      () => reloadLanguageTools.value?.(),
      { deep: true },
    )

    watch(
      () => files.value[viteConfigFile]?.code,
      async () => {
        await getViteConfig()
        errors.value = []
        for (const [_, file] of Object.entries(files.value)) {
          await compileFile(store, file).then((errs) =>
            errors.value.push(...errs),
          )
        }
      },
    )

    // compile rest of the files
    errors.value = []
    for (const [filename, file] of Object.entries(files.value)) {
      if (
        ![activeConfigFile.value.filename, activeFile.value.filename].includes(
          filename,
        )
      )
        await compileFile(store, file).then((errs) =>
          errors.value.push(...errs),
        )
    }

    loading.value = false
  }

  function setActive(filename: string) {
    if (configFileNames.includes(filename))
      activeConfigFilename.value = filename
    else activeFilename.value = filename
  }
  const addFile: Store['addFile'] = (fileOrFilename) => {
    let file: File
    if (typeof fileOrFilename === 'string') {
      file = new File(
        fileOrFilename,
        fileOrFilename.endsWith('.tsx')
          ? `export default () => {
  return <div></div>
}`
          : '',
      )
    } else {
      file = fileOrFilename
    }
    files.value[file.filename] = file
    if (!file.hidden) setActive(file.filename)
  }
  const deleteFile: Store['deleteFile'] = (filename) => {
    if (
      !confirm(`Are you sure you want to delete ${stripSrcPrefix(filename)}?`)
    ) {
      return
    }

    if (activeFilename.value === filename) {
      activeFilename.value = appFile
    }
    delete files.value[filename]
  }

  const renameFile: Store['renameFile'] = async (oldFilename, newFilename) => {
    const file = files.value[oldFilename]

    if (!file) {
      errors.value = [`Could not rename "${oldFilename}", file not found`]
      return
    }

    if (!newFilename || oldFilename === newFilename) {
      errors.value = [`Cannot rename "${oldFilename}" to "${newFilename}"`]
      return
    }

    file.filename = newFilename
    const newFiles: Record<string, File> = {}

    // Preserve iteration order for files
    for (const [name, file] of Object.entries(files.value)) {
      if (name === oldFilename) {
        newFiles[newFilename] = file
      } else {
        newFiles[name] = file
      }
    }

    files.value = newFiles

    if (activeFilename.value === oldFilename) {
      activeFilename.value = newFilename
    } else {
      await compileFile(store, file).then((errs) => (errors.value = errs))
    }
  }

  const importMap = computed<ImportMap>(() => {
    try {
      const result = JSON.parse(files.value[importMapFile]?.code || '{}')
      if (result.imports)
        for (const [key, value] of Object.entries(result.imports)) {
          if (value) {
            result.imports[key] = (value + '').startsWith('http')
              ? value
              : location.origin + value
          }
        }
      return result
    } catch (e) {
      errors.value = [
        `Syntax error in ${importMapFile}: ${(e as Error).message}`,
      ]
      return { imports: {}, scopes: {} }
    }
  })

  const getTsConfig: Store['getTsConfig'] = () => {
    try {
      return JSON.parse(files.value[tsconfigFile].code)
    } catch {
      return {}
    }
  }

  const getTsMacroConfig: Store['getTsMacroConfig'] = async () => {
    let code = files.value[tsMacroConfigFile]?.code
    for (let name in store.importMap.imports) {
      code = code.replaceAll(
        new RegExp(`(?<=from\\s+['"])${name}(?=['"])`, 'g'),
        store.importMap.imports[name] as string,
      )
    }
    return (
      'data:text/javascript;charset=utf-8,' +
      encodeURIComponent(await transformTS(addEsmPrefix(code, importMap.value)))
    )
  }

  const viteConfig = ref({} as ViteConfig)
  const getViteConfig = async () => {
    let code = files.value[viteConfigFile]?.code
    for (let name in store.importMap.imports) {
      code = code.replaceAll(
        new RegExp(`(?<=from\\s+['"])${name}(?=['"])`, 'g'),
        store.importMap.imports[name] as string,
      )
    }
    try {
      store.viteConfig = await import(
        'data:text/javascript;charset=utf-8,' +
          encodeURIComponent(
            await transformTS(addEsmPrefix(code, importMap.value)),
          )
      ).then((i) => i.default)
    } catch (e) {
      errors.value = [
        `Syntax error in ${importMapFile}: ${(e as Error).message}`,
      ]
      console.error(e)
      store.viteConfig = { plugins: [] }
    }
    return store.viteConfig
  }

  const serialize: ReplStore['serialize'] = () => {
    const files = getFiles()
    return '#' + utoa(JSON.stringify(files))
  }
  function resolveHash(serializedState: string) {
    if (serializedState.startsWith('#'))
      serializedState = serializedState.slice(1)
    let saved: any
    try {
      saved = JSON.parse(atou(serializedState))
    } catch (err) {
      console.error(err)
      alert('Failed to load code from URL.')
      return setDefaultFile()
    }
    return saved
  }
  function deserialize(serializedState: string) {
    const saved = resolveHash(serializedState)
    if (!saved) return
    for (const filename in saved) {
      setFile(
        files.value,
        filename,
        saved[filename].code,
        saved[filename].hidden,
      )
    }
  }
  function getFiles() {
    const exported: Record<string, { code: string; hidden?: boolean }> = {}
    for (const [filename, file] of Object.entries(files.value)) {
      exported[filename] = { code: file.code, hidden: file.hidden }
    }
    return exported
  }
  async function setFiles(newFiles: Record<string, File>) {
    const result: Record<string, File> = Object.create(null)
    for (const [filename, file] of Object.entries(newFiles)) {
      setFile(result, filename, file.code, file.hidden)
    }
    files.value = result
  }

  if (serializedState) {
    deserialize(serializedState)
  }

  const activeFile = computed(() => files.value[activeFilename.value] || files.value[appFile])
  const activeConfigFile = computed(
    () => files.value[activeConfigFilename.value] || defaultPresets['vue-jsx'],
  )

  const fileCaches = ref(Object.create(null))

  const store: ReplStore = reactive({
    organization,
    organizations,
    userName,
    files,
    fileCaches,
    activeFile,
    activeFilename,
    activeConfigFile,
    activeConfigFilename,
    template,
    importMap,
    user,
    project,

    errors,
    showOutput,
    outputMode,
    theme,
    loading,

    locale,
    typescriptVersion,
    dependencyVersion,
    reloadLanguageTools,
    viteConfig,
    preset,
    presets,

    init,
    setActive,
    addFile,
    deleteFile,
    renameFile,
    getTsConfig,
    getTsMacroConfig,
    serialize,
    deserialize,
    getFiles,
    setFiles,
  })
  return store
}

export interface ImportMap {
  imports?: Record<string, string | undefined>
  scopes?: Record<string, Record<string, string>>
}

export type Template = {
  [indexHtmlFile]: File
  [appFile]: File
  [viteConfigFile]: File
  [tsMacroConfigFile]: File
  [tsconfigFile]: File
  [importMapFile]: File
}

export type StoreState = ToRefs<{
  files: Record<string, File>
  fileCaches: Record<string, string>
  activeFilename: string
  activeConfigFilename: string
  importMap: ImportMap

  // output
  errors: (string | Error)[]
  showOutput: boolean
  outputMode: OutputModes
  theme: 'light' | 'dark'
  loading: boolean

  // volar-related
  locale: string | undefined
  typescriptVersion: string
  /** \{ dependencyName: version \} */
  dependencyVersion: Record<string, string>
  reloadLanguageTools?: (() => void) | undefined

  preset: string
  presets: Record<string, Template>
}>

export type VitePlugin = {
  name?: string
  resolveId?: (id: string) => string | null | undefined
  load?: (id: string) => string | null | undefined
  transformInclude?: (id: string) => boolean
  transform?: (
    code: string,
    id: string,
  ) => string | { code: string; map: any } | null | undefined
}
export type ViteConfig = {
  plugins: VitePlugin[]
}

export interface ReplStore extends UnwrapRef<StoreState> {
  organization?: Organization
  organizations: Organization[]
  userName: string
  user: User
  project?: Project
  activeFile: File
  activeConfigFile: File
  viteConfig: ViteConfig
  init(): Promise<void>
  setActive(filename: string): void
  addFile(filename: string | File): void
  deleteFile(filename: string): void
  renameFile(oldFilename: string, newFilename: string): void
  getTsConfig(): Record<string, any>
  getTsMacroConfig(): Promise<string>
  serialize(): string
  deserialize(serializedState: string): void
  getFiles(): Record<string, { code: string; hidden?: boolean }>
  setFiles(newFiles: Record<string, File>): Promise<void>
}

export type Store = Pick<
  ReplStore,
  | 'organization'
  | 'organizations'
  | 'userName'
  | 'user'
  | 'project'
  | 'files'
  | 'serialize'
  | 'fileCaches'
  | 'activeFile'
  | 'activeConfigFile'
  | 'errors'
  | 'showOutput'
  | 'outputMode'
  | 'locale'
  | 'typescriptVersion'
  | 'dependencyVersion'
  | 'reloadLanguageTools'
  | 'init'
  | 'setActive'
  | 'addFile'
  | 'deleteFile'
  | 'renameFile'
  | 'getTsConfig'
  | 'viteConfig'
  | 'getTsMacroConfig'
  | 'preset'
  | 'presets'
  | 'importMap'
  | 'theme'
  | 'loading'
>

export class File {
  compiled = {
    js: '',
    css: '',
    volar: '',
    ssr: '',
  }
  editorViewState: editor.ICodeEditorViewState | null = null

  constructor(
    public filename: string,
    public code = '',
    public hidden = false,
  ) {}

  get language() {
    if (this.filename.endsWith('.vue')) {
      return 'vue'
    }
    if (this.filename.endsWith('.html')) {
      return 'html'
    }
    if (cssRE.test(this.filename)) {
      return 'css'
    }
    if (this.filename.endsWith('.ts')) {
      return 'typescript'
    }
    return 'javascript'
  }
}

export function addSrcPrefix(file: string) {
  const sep = file.startsWith('/') ? '' : '/'
  return configFileNames.includes(file) || file.startsWith('src/')
    ? file
    : `src${sep}${file}`
}

export function stripSrcPrefix(file: string) {
  return file.replace(/^src\//, '')
}

function setFile(
  files: Record<string, File>,
  filename: string,
  content: string,
  hidden = false,
) {
  const normalized = addSrcPrefix(filename)
  files[normalized] = new File(normalized, content, hidden)
}
