/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { createApp, h, ref, watchEffect } from 'vue'
import {
  mergeImportMap,
  type OutputModes,
  Repl,
  useStore,
  useVueImportMap,
} from '../src'
// @ts-ignore
import MonacoEditor from '../src/editor/MonacoEditor.vue'
// @ts-ignore
import CodeMirrorEditor from '../src/editor/CodeMirrorEditor.vue'

const window = globalThis.window as any
window.process = { env: {} }

const App = {
  setup() {
    const isVapor = ref(true)
    const query = new URLSearchParams(location.search)
    const { importMap: builtinImportMap, vueVersion } = useVueImportMap({
      runtimeDev: import.meta.env.PROD
        ? undefined
        : `${location.origin}/src/proxy/vue`,
      serverRenderer: import.meta.env.PROD
        ? undefined
        : `${location.origin}/src/proxy/vue-server-renderer`,
      isVapor: isVapor.value,
    })
    const prefix = `${location.origin}${import.meta.env.PROD ? '' : '/src/proxy'}`
    const suffix = import.meta.env.PROD ? '.js' : ''
    const ImportMap = ref(
      mergeImportMap(builtinImportMap.value, {
        imports: {
          '@vue-macros/jsx-directive.js': `${prefix}/vite-plugin-jsx-directive${suffix}`,
          '@vue-macros/volar/jsx-directive.js': `${prefix}/volar-plugin-jsx-directive${suffix}`,
          '@vue-macros/volar/jsx-ref.js': `${prefix}/volar-plugin-jsx-ref${suffix}`,
        },
      }),
    )
    const store = (window.store = useStore(
      {
        builtinImportMap: ImportMap,
        vueVersion,
        isVapor,
        showOutput: ref(query.has('so')),
        outputMode: ref((query.get('om') as OutputModes) || 'preview'),
        viteConfigCode: ref(
          `// @ts-nocheck
import transformJsxDirective from '@vue-macros/jsx-directive.js'

export default {
  plugins: [
    transformJsxDirective,
  ]
}
`,
        ),
        tsMacroConfigCode: ref(
          `// @ts-nocheck
import jsxDirective from '@vue-macros/volar/jsx-directive.js'
import jsxRef from '@vue-macros/volar/jsx-ref.js'

export default {
  plugins: [
    jsxDirective(),
    jsxRef()
  ]
}`,
        ),
      },
      location.hash,
    ))
    console.info(store)

    watchEffect(() => history.replaceState({}, '', store.serialize()))

    // setTimeout(() => {
    //   store.setFiles(
    //     {
    //       'src/index.html': '<h1>yo</h1>',
    //       'src/main.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //       'src/foo.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //       'src/bar.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //       'src/baz.js': 'document.body.innerHTML = "<h1>hello</h1>"',
    //     },
    //     'src/index.html',
    //   )
    // }, 1000)

    // store.vueVersion = '3.4.1'
    const theme = ref<'light' | 'dark'>('dark')
    window.theme = theme
    const previewTheme = ref(false)
    window.previewTheme = previewTheme

    return () =>
      h(Repl, {
        store,
        theme: theme.value,
        previewTheme: previewTheme.value,
        editor: MonacoEditor,
        // layout: 'vertical',
        ssr: false,
        // showCompileOutput: false,
        // showImportMap: false
        editorOptions: {
          autoSaveText: 'Auto Save',
          showHiddenText: 'Hidden Files',
          isVaporText: 'Vapor Mode',
          monacoOptions: {
            // wordWrap: 'on',
          },
        },
        // autoSave: false,
      })
  },
}

createApp(App).mount('#app')
