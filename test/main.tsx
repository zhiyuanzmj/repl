import { createVaporApp, ref,vaporInteropPlugin } from 'vue'
import { Repl, useStore } from '../src'
import MonacoEditor from '../src/editor/MonacoEditor'

import 'uno.css'

const window = globalThis.window as any
window.process = { env: {} }

const App = defineVaporComponent(() => {
  const query = new URLSearchParams(location.search)
  let loading = $ref(true)
  let store!: any
  useStore(
    {
      showOutput: ref(query.has('so')),
    },
    location.hash,
  ).then((result) => {
    store = window.store = result
    loading = false
  })

  const previewTheme = $ref(false)

  return (
    <>
      <div
        v-if={loading}
        class="i-carbon:rotate-180 text h-10 w-10 relative top-45% m-auto animate-spin"
      />
      <Repl
        v-else
        editor={MonacoEditor}
        editorOptions={{
          autoSaveText: 'Auto Save',
          virtualFilesText: 'Virtual Files',
          monacoOptions: {
            // wordWrap: 'on',
          },
        }}
        previewTheme={previewTheme}
        store={store}
      />
    </>
  )
})

const app =createVaporApp(App) 
window.app = app
app.use(vaporInteropPlugin).mount('#app')