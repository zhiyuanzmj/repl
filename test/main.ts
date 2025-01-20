/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { createApp, h, ref, watchEffect } from 'vue'
import { type OutputModes, Repl, useStore, useVueImportMap } from '../src'
// @ts-ignore
import MonacoEditor from '../src/editor/MonacoEditor.vue'
// @ts-ignore
import CodeMirrorEditor from '../src/editor/CodeMirrorEditor.vue'

const window = globalThis.window as any
window.process = { env: {} }

const App = {
  setup() {
    const query = new URLSearchParams(location.search)
    const { importMap: builtinImportMap, vueVersion } = useVueImportMap({
      runtimeDev: import.meta.env.PROD
        ? undefined
        : `${location.origin}/src/vue-dev-proxy`,
      serverRenderer: import.meta.env.PROD
        ? undefined
        : `${location.origin}/src/vue-server-renderer-dev-proxy`,
    })
    const store = (window.store = useStore(
      {
        builtinImportMap,
        vueVersion,
        showOutput: ref(query.has('so')),
        outputMode: ref((query.get('om') as OutputModes) || 'preview'),
        viteConfigCode: ref(
          `import {transformVueJsxVapor,helperId,helperCode} from '${location.origin}/src/vue-jsx-vapor-dev-proxy'
import { transformJsxDirective } from '${location.origin}/src/vite-plugin-jsx-directive'

export default {
  plugins: [
    { transform: transformJsxDirective },
    {
      resolveId(id){
        if(id === helperId) return id
      },
      load(id){
        if(id===helperId) return helperCode
      },
      transform:transformVueJsxVapor
    }
  ]
}
`,
        ),
        tsMacroConfigCode: ref(
          `import jsxDirective from '${location.origin}/src/volar-plugin-jsx-directive'

export default {
  plugins: [
    jsxDirective()
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
        sfcOptions: {
          script: {
            // inlineTemplate: false
          },
        },
        // showCompileOutput: false,
        // showImportMap: false
        editorOptions: {
          autoSaveText: 'Auto Save',
          showHiddenText: 'Hidden Files',
          monacoOptions: {
            // wordWrap: 'on',
          },
        },
        // autoSave: false,
      })
  },
}

createApp(App).mount('#app')
