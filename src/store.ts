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
import type { OutputModes, Project, User } from './types'
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
  newFile,
} from './presets/index'

export {
  importMapFile,
  tsconfigFile,
  viteConfigFile,
  tsMacroConfigFile,
  indexHtmlFile,
  appFile,
  newFile,
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
    mainFile = ref(appFile),

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
    presets = ref(defaultPresets),
  }: Partial<StoreState> = {},
  serializedState?: string,
): Promise<ReplStore> {
  const user = ref({} as User)
  if (document.cookie.split('; ').some((i) => /^token=\S+/.test(i)))
    user.value = await ofetch('/api/user-info').catch(() => ({}))

  const projects = ref<Project[]>([])
  async function getProjects() {
    if (!user.value.id) return
    const { data } = await ofetch('/api/project', {
      params: {
        userId: user.value.id,
      },
    })
    projects.value = data
  }
  await getProjects()

  const project = ref<Project>()
  const template = ref({} as Template)
  async function getTemplate() {
    if (presets.value[preset.value]) {
      template.value = presets.value[preset.value]
    } else {
      project.value =
        projects.value.find(
          (i) => `${i.user.username}/${i.name}` === preset.value,
        ) || (await ofetch('/api/project/' + preset.value))
      if (!project.value) {
        preset.value = 'vue-jsx'
        template.value = presets.value['vue-jsx']
        return
      }
      serializedState ??= project.value.hash
      template.value = resolveHash(project.value?.hash ?? '')
    }
  }
  await getTemplate()

  async function init() {
    watch(preset, async () => {
      await getTemplate()
      setFiles(
        {
          [indexHtmlFile]: template.value[indexHtmlFile].code,
          [appFile]: template.value[appFile].code,
          [viteConfigFile]: template.value[viteConfigFile].code,
          [tsMacroConfigFile]: template.value[tsMacroConfigFile].code,
          [tsconfigFile]: template.value[tsconfigFile].code,
          [importMapFile]: template.value[importMapFile].code,
        },
        appFile,
      )
    })

    await getViteConfig()

    watchEffect(async () => {
      await compileFile(store, activeFile.value).then(
        (errs) => (errors.value = errs),
      )
    })
    watchEffect(async () => {
      await compileFile(store, activeConfigFile.value).then(
        (errs) => (errors.value = errs),
      )
    })
    await compileFile(store, files.value[mainFile.value]).then(
      (errs) => (errors.value = errs),
    )

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
      if (filename !== mainFile.value) {
        await compileFile(store, file).then((errs) =>
          errors.value.push(...errs),
        )
      }
    }

    loading.value = false
  }

  const setActive: Store['setActive'] = (filename) => {
    if (configFileNames.includes(filename))
      activeConfigFilename.value = filename
    else activeFilename.value = filename
  }
  const addFile: Store['addFile'] = (fileOrFilename) => {
    let file: File
    if (typeof fileOrFilename === 'string') {
      file = new File(
        fileOrFilename,
        fileOrFilename.endsWith('.tsx') ? template.value[newFile].code : '',
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
      activeFilename.value = mainFile.value
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

    if (mainFile.value === oldFilename) {
      mainFile.value = newFilename
    }
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
  const getFiles: ReplStore['getFiles'] = () => {
    const exported: Record<string, { code: string; hidden?: boolean }> = {}
    for (const [filename, file] of Object.entries(files.value)) {
      exported[filename] = { code: file.code, hidden: file.hidden }
    }
    return exported
  }
  const setFiles: ReplStore['setFiles'] = async (
    newFiles,
    mainFile = store.mainFile,
  ) => {
    loading.value = true
    const files: Record<string, File> = Object.create(null)

    mainFile = addSrcPrefix(mainFile)
    if (!newFiles[mainFile]) {
      setFile(files, mainFile, template.value[appFile].code)
    }
    for (const [filename, file] of Object.entries(newFiles)) {
      setFile(files, filename, file)
    }

    const errors = []
    for (const file of Object.values(files)) {
      errors.push(...(await compileFile(store, file)))
    }

    store.mainFile = mainFile
    store.files = files
    store.errors = errors
    setActive(store.mainFile)
    setTimeout(() => {
      loading.value = false
    }, 1000)
  }
  const setDefaultFile = (): void => {
    setFile(files.value, indexHtmlFile, template.value[indexHtmlFile].code)
    setFile(files.value, appFile, template.value[appFile].code)
    setFile(files.value, viteConfigFile, template.value[viteConfigFile].code)
    setFile(
      files.value,
      tsMacroConfigFile,
      template.value[tsMacroConfigFile].code,
    )
    setFile(files.value, tsconfigFile, template.value[tsconfigFile].code)
    setFile(files.value, importMapFile, template.value[importMapFile].code)
  }

  if (serializedState) {
    deserialize(serializedState)
  } else {
    setDefaultFile()
  }

  watchEffect(() => {
    if (user.value.id && !presets.value[preset.value]) {
      history.pushState(null, '', location.pathname + location.search)
    } else {
      history.replaceState({}, '', serialize())
    }
  })

  if (!files.value[mainFile.value]) {
    mainFile.value = Object.keys(files.value).find((i) => i.endsWith('.tsx'))!
  }
  const activeFile = computed(() => files.value[activeFilename.value])
  const activeConfigFile = computed(
    () => files.value[activeConfigFilename.value] || defaultPresets['vue-jsx'],
  )

  const fileCaches = ref(Object.create(null))

  const store: ReplStore = reactive({
    files,
    fileCaches,
    activeFile,
    activeFilename,
    activeConfigFile,
    activeConfigFilename,
    mainFile,
    template,
    importMap,
    user,
    project,
    projects,
    getProjects,

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

type TemplateItem = { code: string; hidden?: boolean }
export type Template = {
  [indexHtmlFile]: TemplateItem
  [appFile]: TemplateItem
  [newFile]: TemplateItem
  [viteConfigFile]: TemplateItem
  [tsMacroConfigFile]: TemplateItem
  [tsconfigFile]: TemplateItem
  [importMapFile]: TemplateItem
}

export type StoreState = ToRefs<{
  files: Record<string, File>
  fileCaches: Record<string, string>
  activeFilename: string
  activeConfigFilename: string
  mainFile: string
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
  user: User
  project?: Project
  projects: Project[]
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
  setFiles(newFiles: Record<string, string>, mainFile?: string): Promise<void>
  getProjects(): Promise<void>
}

export type Store = Pick<
  ReplStore,
  | 'user'
  | 'project'
  | 'projects'
  | 'getProjects'
  | 'files'
  | 'serialize'
  | 'fileCaches'
  | 'activeFile'
  | 'activeConfigFile'
  | 'mainFile'
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
