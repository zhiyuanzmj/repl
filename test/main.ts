/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { createApp, h, ref, watchEffect } from 'vue'
import { type OutputModes, Repl, useStore } from '../src'
// @ts-ignore
import MonacoEditor from '../src/editor/MonacoEditor.vue'
// @ts-ignore
import CodeMirrorEditor from '../src/editor/CodeMirrorEditor.vue'

import 'uno.css'

const window = globalThis.window as any
window.process = { env: {} }

const App = {
  setup() {
    const query = new URLSearchParams(location.search)
    const store = (window.store = useStore(
      {
        showOutput: ref(query.has('so')),
        outputMode: ref((query.get('om') as OutputModes) || 'js'),
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
    const previewTheme = ref(false)

    return () =>
      h(Repl, {
        store,
        theme: theme.value,
        previewTheme: previewTheme.value,
        editor: MonacoEditor,
        layout: 'vertical',
        ssr: false,
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
