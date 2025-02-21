/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { createApp, h, ref } from 'vue'
import { Repl, useStore } from '../src'
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
    const loading = ref(true)
    let store!: any
    useStore(
      {
        showOutput: ref(query.has('so')),
      },
      location.hash,
    ).then((result) => {
      store = window.store = result
      loading.value = false
    })

    const previewTheme = ref(false)

    return () =>
      loading.value
        ? h('div', {
            class:
              'i-carbon:rotate-180 text h-10 w-10 relative top-45% m-auto animate-spin',
          })
        : h(Repl, {
            store,
            previewTheme: previewTheme.value,
            editor: MonacoEditor,
            ssr: false,
            // showCompileOutput: false,
            editorOptions: {
              autoSaveText: 'Auto Save',
              virtualFilesText: 'Virtual Files',
              monacoOptions: {
                // wordWrap: 'on',
              },
            },
          })
  },
}

createApp(App).mount('#app')
