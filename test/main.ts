/* eslint-disable @typescript-eslint/prefer-ts-expect-error */
import { createApp, h, ref, watchEffect } from 'vue'
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
    const store = (window.store = useStore(
      {
        showOutput: ref(query.has('so')),
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
