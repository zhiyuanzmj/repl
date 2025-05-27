import Preview from './Preview'
import Login from './user/Login'
import {
  type EditorComponentType,
  type OutputModes,
  injectKeyProps,
} from '../types'
import SplitPane from '../SplitPane'
import Devtools from './Devtools'
import Preset from './user/Project'
import { useRef } from 'vue-jsx-vapor'

export default defineVaporComponent(
  (props: {
    editorComponent: EditorComponentType
    showCompileOutput?: boolean
    ssr: boolean
  }) => {
    const { store } = $inject(injectKeyProps)!
    let previewRef = $useRef()
    const modes = $computed(() =>
      props.showCompileOutput
        ? (['js', 'ts', 'css', 'devtools'] as const)
        : ([] as const),
    )

    let mode = $computed<OutputModes>({
      get: () =>
        (modes as readonly string[]).includes(store.outputMode)
          ? store.outputMode
          : 'js',
      set(value) {
        if ((modes as readonly string[]).includes(store.outputMode)) {
          store.outputMode = value
        }
      },
    })

    function jumpToGithub() {
      open('https://github.com/zhiyuanzmj/repl')
    }

    function reload() {
      previewRef?.reload()
    }

    defineExpose$({ reload, previewRef })

    const toggleDark = () => {
      document.documentElement.classList.toggle('dark')
      store.theme = store.theme === 'dark' ? 'light' : 'dark'
    }

    let devtoolsLoaded = $ref(mode === 'devtools')

    return (
      <SplitPane layout="vertical">
        <template v-slot:left>
          <div class="flex-1 h-full">
            <div class="tab-buttons">
              <button class="active">
                <span>preview</span>
              </button>

              <div class="actions ml-auto flex items-center gap-2 pr-2">
                <Preset />

                <button
                  class={[
                    'text-xl',
                    store.theme === 'dark' ? 'i-carbon:moon' : 'i-carbon:light',
                  ]}
                  onClick={toggleDark}
                />

                <button
                  class="i-carbon:logo-github text-2xl"
                  onClick={jumpToGithub}
                />

                <Login />
              </div>
            </div>
            <Preview
              v-if={!store.loading}
              ref={(e) => (previewRef = e)}
              ssr={props.ssr}
            />
            <div
              v-else
              class="i-carbon:rotate-180 text-gray h-full mt--4 w-10 m-auto animate-spin"
            />
          </div>
        </template>

        <template v-slot:right>
          <div class="flex h-full flex-1 flex-col overflow-hidden">
            <div class="tab-buttons">
              <button
                v-for={m in modes}
                key={m}
                class={{ active: mode === m }}
                onClick={() => {
                  mode = m
                  if (m === 'devtools') {
                    devtoolsLoaded = true
                  }
                }}
              >
                <span>{m}</span>
              </button>
            </div>

            <Devtools
              v-if={devtoolsLoaded && previewRef?.container}
              previewContainer={previewRef.container}
              theme={store.theme}
              v-show={mode === 'devtools'}
            />
            <props.editorComponent
              v-if={mode !== 'devtools'}
              readonly
              filename={store.activeFile.filename}
              mode={mode}
              value={store.activeFile.compiled[mode]}
            />
          </div>
        </template>
      </SplitPane>
    )

    defineStyle(`
      .tab-buttons {
        display: flex;
        box-sizing: border-box;
        border-top: 1px solid var(--border);
        border-bottom: 1px solid var(--border);
        background-color: var(--bg);
        min-height: var(--header-height);
        overflow: hidden;
      }
      
      .tab-buttons button {
        padding: 0;
        box-sizing: border-box;
      }
      
      .tab-buttons .actions button {
        background-color: currentColor;
      }
      
      .tab-buttons span {
        font-size: 13px;
        font-family: var(--font-code);
        text-transform: uppercase;
        color: var(--text-light);
        display: inline-block;
        padding: 8px 16px 6px;
        line-height: 20px;
      }
      
      button.active {
        color: var(--color-branding-dark);
        border-bottom: 3px solid var(--color-branding-dark);
      }
    `)
  },
  { props: ['editorComponent', 'showCompileOutput', 'ssr'] },
)
