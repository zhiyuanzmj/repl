import {
  type ToRefs,
  type UnwrapRef,
  computed,
  reactive,
  ref,
  watch,
  watchEffect,
} from 'vue'
import { compileFile } from './transform'
import { atou, utoa } from './utils'
import type { OutputModes } from './types'
import type { editor } from 'monaco-editor-core'
import { type ImportMap, mergeImportMap, useVueImportMap } from './import-map'

import welcomeCode from './template/welcome.tsx?raw'
import newCode from './template/new?raw'

export const importMapFile = 'import-map.json'
export const tsconfigFile = 'tsconfig.json'
export const viteConfigFile = 'vite.config.ts'
export const tsMacroConfigFile = 'tsm.config.ts'

export function useStore(
  {
    files = ref(Object.create(null)),
    activeFilename = undefined!, // set later
    mainFile = ref('src/App.tsx'),
    template = ref({
      welcome: welcomeCode,
      new: newCode,
    }),
    builtinImportMap = undefined!, // set later

    errors = ref([]),
    showOutput = ref(false),
    outputMode = ref('preview'),
    vueVersion = ref(null),

    locale = ref(),
    typescriptVersion = ref('latest'),
    dependencyVersion = ref(Object.create(null)),
    reloadLanguageTools = ref(),

    tsMacroConfigCode = ref(`export default { plugins: [] }`),
    viteConfigCode = ref(`export default { plugins: [] }`),
    isVapor = ref(true),
  }: Partial<StoreState> = {},
  serializedState?: string,
): ReplStore {
  if (!builtinImportMap) {
    ;({ importMap: builtinImportMap, vueVersion } = useVueImportMap({
      vueVersion: vueVersion.value,
      isVapor: isVapor.value,
    }))
  }

  function applyBuiltinImportMap() {
    const importMap = mergeImportMap(builtinImportMap.value, getImportMap())
    setImportMap(importMap)
  }

  async function init() {
    if (!files.value[viteConfigFile]) {
      files.value[viteConfigFile] = new File(
        viteConfigFile,
        viteConfigCode.value,
      )
    }
    if (!files.value[tsMacroConfigFile]) {
      files.value[tsMacroConfigFile] = new File(
        tsMacroConfigFile,
        tsMacroConfigCode.value,
      )
    }
    // init tsconfig
    if (!files.value[tsconfigFile]) {
      files.value[tsconfigFile] = new File(
        tsconfigFile,
        JSON.stringify(tsconfig, undefined, 2),
      )
    }
    await getViteConfig()

    watch(isVapor, () => {
      ;({ importMap: builtinImportMap, vueVersion } = useVueImportMap({
        vueVersion: vueVersion.value,
        isVapor: isVapor.value,
      }))
      const importMap = mergeImportMap(getImportMap(), builtinImportMap.value)
      setImportMap(importMap)
    })

    watchEffect(() => {
      compileFile(store, activeFile.value).then((errs) => (errors.value = errs))
    })

    watch(
      () => [
        files.value[tsMacroConfigFile]?.code,
        files.value[tsconfigFile]?.code,
        typescriptVersion.value,
        locale.value,
        dependencyVersion.value,
        vueVersion.value,
      ],
      () => reloadLanguageTools.value?.(),
      { deep: true },
    )

    watch(
      () => files.value[viteConfigFile]?.code,
      async () => {
        await getViteConfig()
        for (const [_, file] of Object.entries(files.value)) {
          compileFile(store, file).then((errs) => errors.value.push(...errs))
        }
      },
    )

    watch(
      builtinImportMap,
      () => {
        setImportMap(mergeImportMap(getImportMap(), builtinImportMap.value))
      },
      { deep: true },
    )

    // compile rest of the files
    errors.value = []
    for (const [filename, file] of Object.entries(files.value)) {
      if (filename !== mainFile.value) {
        compileFile(store, file).then((errs) => errors.value.push(...errs))
      }
    }
  }

  function setImportMap(map: ImportMap) {
    if (map.imports)
      for (const [key, value] of Object.entries(map.imports)) {
        if (value) {
          map.imports![key] = fixURL(value)
        }
      }

    const code = JSON.stringify(map, undefined, 2)
    if (files.value[importMapFile]) {
      files.value[importMapFile].code = code
    } else {
      files.value[importMapFile] = new File(importMapFile, code)
    }
  }

  const setActive: Store['setActive'] = (filename) => {
    activeFilename.value = filename
  }
  const addFile: Store['addFile'] = (fileOrFilename) => {
    let file: File
    if (typeof fileOrFilename === 'string') {
      file = new File(
        fileOrFilename,
        fileOrFilename.endsWith('.tsx') ? template.value.new : '',
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
  const renameFile: Store['renameFile'] = (oldFilename, newFilename) => {
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
      compileFile(store, file).then((errs) => (errors.value = errs))
    }
  }
  const getImportMap: Store['getImportMap'] = () => {
    try {
      return JSON.parse(files.value[importMapFile]?.code || '{}')
    } catch (e) {
      errors.value = [
        `Syntax error in ${importMapFile}: ${(e as Error).message}`,
      ]
      return {}
    }
  }
  const getTsConfig: Store['getTsConfig'] = () => {
    try {
      return JSON.parse(files.value[tsconfigFile].code)
    } catch {
      return {}
    }
  }

  const getTsMacroConfig: Store['getTsMacroConfig'] = () => {
    let code = files.value[tsMacroConfigFile]?.code
    for (let name in store.builtinImportMap.imports) {
      code = code.replaceAll(
        new RegExp(`(?<=from\\s+['"])${name}(?=['"])`, 'g'),
        store.builtinImportMap.imports[name] as string,
      )
    }
    return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(code)
  }

  const viteConfig = ref({} as ViteConfig)
  const getViteConfig = async () => {
    let code = files.value[viteConfigFile]?.code
    for (let name in store.builtinImportMap.imports) {
      code = code.replaceAll(
        new RegExp(`(?<=from\\s+['"])${name}(?=['"])`, 'g'),
        store.builtinImportMap.imports[name] as string,
      )
    }
    return (store.viteConfig = await import(
      'data:text/javascript;charset=utf-8,' + encodeURIComponent(code)
    ).then((i) => i.default))
  }

  const serialize: ReplStore['serialize'] = () => {
    const files = getFiles()
    const importMap = files[importMapFile]
    if (importMap) {
      const parsed = JSON.parse(importMap.code)
      const builtin = builtinImportMap.value.imports || {}

      if (parsed.imports) {
        for (const [key, value] of Object.entries(parsed.imports)) {
          if (builtin[key] === value) {
            delete parsed.imports[key]
          }
        }
        if (parsed.imports && !Object.keys(parsed.imports).length) {
          delete parsed.imports
        }
      }
      if (parsed.scopes && !Object.keys(parsed.scopes).length) {
        delete parsed.scopes
      }
      if (Object.keys(parsed).length) {
        files[importMapFile] = { code: JSON.stringify(parsed, null, 2) }
      } else {
        delete files[importMapFile]
      }
    }
    // @ts-ignore
    if (vueVersion.value) files._version = vueVersion.value
    return '#' + utoa(JSON.stringify(files))
  }
  const deserialize: ReplStore['deserialize'] = (serializedState: string) => {
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
    for (const filename in saved) {
      if (filename === '_version') {
        vueVersion.value = saved[filename]
      } else {
        setFile(
          files.value,
          filename,
          saved[filename].code,
          saved[filename].hidden,
        )
      }
    }
  }
  const getFiles: ReplStore['getFiles'] = () => {
    const exported: Record<string, { code: string; hidden?: boolean }> = {}
    for (const [filename, file] of Object.entries(files.value)) {
      const normalized = stripSrcPrefix(filename)
      exported[normalized] = { code: file.code, hidden: file.hidden }
    }
    return exported
  }
  const setFiles: ReplStore['setFiles'] = async (
    newFiles,
    mainFile = store.mainFile,
  ) => {
    const files: Record<string, File> = Object.create(null)

    mainFile = addSrcPrefix(mainFile)
    if (!newFiles[mainFile]) {
      setFile(files, mainFile, template.value.welcome || welcomeCode)
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
    applyBuiltinImportMap()
    setActive(store.mainFile)
  }
  const setDefaultFile = (): void => {
    setFile(files.value, mainFile.value, template.value.welcome || welcomeCode)
  }

  if (serializedState) {
    deserialize(serializedState)
  } else {
    setDefaultFile()
  }
  if (!files.value[mainFile.value]) {
    mainFile.value = Object.keys(files.value)[0]
  }
  activeFilename ||= ref(mainFile.value)
  const activeFile = computed(() => files.value[activeFilename.value])

  applyBuiltinImportMap()

  const store: ReplStore = reactive({
    files,
    activeFile,
    activeFilename,
    mainFile,
    template,
    builtinImportMap,

    errors,
    showOutput,
    outputMode,
    vueVersion,

    locale,
    typescriptVersion,
    dependencyVersion,
    reloadLanguageTools,
    viteConfig,
    viteConfigCode,
    tsMacroConfigCode,
    isVapor,

    init,
    setActive,
    addFile,
    deleteFile,
    renameFile,
    getImportMap,
    getTsConfig,
    getTsMacroConfig,
    serialize,
    deserialize,
    getFiles,
    setFiles,
  })
  return store
}

const tsconfig = {
  compilerOptions: {
    allowJs: true,
    checkJs: true,
    jsx: 'Preserve',
    target: 'ESNext',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    allowImportingTsExtensions: true,
  },
}

export type StoreState = ToRefs<{
  files: Record<string, File>
  activeFilename: string
  mainFile: string
  template: {
    welcome?: string
    new?: string
  }
  builtinImportMap: ImportMap

  // output
  errors: (string | Error)[]
  showOutput: boolean
  outputMode: OutputModes
  vueVersion: string | null

  // volar-related
  locale: string | undefined
  typescriptVersion: string
  /** \{ dependencyName: version \} */
  dependencyVersion: Record<string, string>
  reloadLanguageTools?: (() => void) | undefined

  viteConfigCode: string
  tsMacroConfigCode: string
  isVapor: boolean
}>

export type VitePlugin = {
  name?: string
  resolveId?: (id: string) => string | null | undefined
  load?: (id: string) => string | null | undefined
  transform?: (
    code: string,
    id: string,
  ) => string | { code: string; map: any } | null | undefined
}
export type ViteConfig = {
  plugins: VitePlugin[]
}

export interface ReplStore extends UnwrapRef<StoreState> {
  activeFile: File
  viteConfig: ViteConfig
  init(): void
  setActive(filename: string): void
  addFile(filename: string | File): void
  deleteFile(filename: string): void
  renameFile(oldFilename: string, newFilename: string): void
  getImportMap(): ImportMap
  getTsConfig(): Record<string, any>
  getTsMacroConfig(): string
  serialize(): string
  deserialize(serializedState: string): void
  getFiles(): Record<string, { code: string; hidden?: boolean }>
  setFiles(newFiles: Record<string, string>, mainFile?: string): Promise<void>
}

export type Store = Pick<
  ReplStore,
  | 'files'
  | 'activeFile'
  | 'mainFile'
  | 'errors'
  | 'showOutput'
  | 'outputMode'
  | 'vueVersion'
  | 'locale'
  | 'typescriptVersion'
  | 'dependencyVersion'
  | 'reloadLanguageTools'
  | 'init'
  | 'setActive'
  | 'addFile'
  | 'deleteFile'
  | 'renameFile'
  | 'getImportMap'
  | 'getTsConfig'
  | 'viteConfig'
  | 'getTsMacroConfig'
  | 'isVapor'
>

export class File {
  compiled = {
    js: '',
    css: '',
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
    if (this.filename.endsWith('.css')) {
      return 'css'
    }
    if (this.filename.endsWith('.ts')) {
      return 'typescript'
    }
    return 'javascript'
  }
}

export function addSrcPrefix(file: string) {
  return file === importMapFile ||
    file === tsconfigFile ||
    file === viteConfigFile ||
    file === tsMacroConfigFile ||
    file.startsWith('src/')
    ? file
    : `src/${file}`
}

export function stripSrcPrefix(file: string) {
  return file.replace(/^src\//, '')
}

function fixURL(url: string) {
  return url.replace('https://sfc.vuejs', 'https://play.vuejs')
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
