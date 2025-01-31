/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { createApp, h, ref, watchEffect } from 'vue'
import { mergeImportMap, type OutputModes, Repl, useStore, useVueImportMap } from '../src'
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
    const { importMap: builtinImportMap, vueVersion } = useVueImportMap()
    const prefix = `${location.origin}${import.meta.env.PROD ? '' : '/src/proxy'}`
    const suffix = import.meta.env.PROD ? '.js' : ''
    const ImportMap = ref(
      mergeImportMap(builtinImportMap.value, {
        imports: {
          '@vue-macros/jsx-macros/api.js': `${prefix}/vite-plugin-jsx-macros${suffix}`,
          '@vue-macros/volar/jsx-macros.js': `${prefix}/volar-plugin-jsx-macros${suffix}`,
        },
      }),
    )
    const store = (window.store = useStore(
      {
        builtinImportMap: ImportMap,
        vueVersion,
        showOutput: ref(query.has('so')),
        outputMode: ref((query.get('om') as OutputModes) || 'js'),
      },
      location.hash,
    ))

    watchEffect(() => history.replaceState({}, '', store.serialize()))

    const previewTheme = ref(false)

    return () =>
      h(Repl, {
        store,
        previewTheme: previewTheme.value,
        editor: MonacoEditor,
        // layout: 'vertical',
        ssr: false,
        // showCompileOutput: false,
        editorOptions: {
          autoSaveText: 'Auto Save',
          virtualFilesText: 'Virtual Files',
          monacoOptions: {
            // wordWrap: 'on',
          },
        },
        // autoSave: false,
      })
  },
}

createApp(App).mount('#app')
