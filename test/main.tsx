import { createVaporApp, ref, vaporInteropPlugin } from 'vue'
import { Repl, useStore } from '../src'
import Monaco from '../src/monaco/Monaco'

import 'uno.css'

const window = globalThis.window as any
window.process = { env: {}, cwd: () => '/' }

const App = defineVaporComponent(() => {
  let loading = $ref(true)
  let store!: any
  useStore({}, location.hash).then((result) => {
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
        editor={Monaco}
        editorOptions={{
          autoSaveText: 'Auto Save',
          virtualFilesText: 'Virtual Files',
          sourceMapText: 'Source Map',
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

const app = createVaporApp(App)
window.app = app
app.use(vaporInteropPlugin).mount('#app')
