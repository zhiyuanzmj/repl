import FileSelector from './FileSelector'
import Message from '../Message'
import { debounce, useRouteQuery } from '../utils'
import { computed, defineComponent, inject } from 'vue'
import ToggleButton from './ToggleButton'
import { type EditorComponentType, injectKeyProps } from '../types'
import { type File, configFileNames } from '../store'
import SplitPane from '../SplitPane'
import { ofetch } from 'ofetch'

export default defineComponent(
  (props: { editorComponent: EditorComponentType }) => {
    const { store, virtualFiles, editorOptions } = $inject(injectKeyProps)!
    const showMessage = useRouteQuery('show-message', true)

    function updateProject() {
      const paths = location.pathname.slice(1).split('/')
      const hasPermission = paths[0] === store.userName && paths[1]
      if (hasPermission) {
        history.pushState(null, '', location.pathname + location.search)
        if (store.project) {
          ofetch(
            '/api/project/' + store.project.userName + '/' + store.project.name,
            {
              method: 'PUT',
              body: {
                hash: store.serialize(),
              },
            },
          )
        }
      } else {
        history.replaceState({}, '', store.serialize())
      }
    }

    const onChange = debounce((code: string) => {
      store.activeFile.code = code
      updateProject()
    }, 250)

    const onConfigChange = debounce((code: string) => {
      store.activeConfigFile.code = code
      updateProject()
    }, 250)

    const resolvedFiles = computed(() => {
      const result = [{}, {}] as Record<string, File>[]
      for (const [name, file] of Object.entries(store.files)) {
        if (configFileNames.includes(name)) {
          result[1][name] = file
        } else {
          result[0][name] = file
        }
      }
      return result
    })

    return () => (
      <>
        <SplitPane layout="vertical">
          <template v-slot:left>
            <div class="editor-container">
              <FileSelector
                activeFile={store.activeFile}
                files={resolvedFiles.value[0]}
              />
              <props.editorComponent
                filename={store.activeFile.filename}
                value={store.activeFile.code}
                onChange={onChange}
              />
            </div>
          </template>
          <template v-slot:right>
            <div class="editor-container">
              <FileSelector
                disabled
                activeFile={store.activeConfigFile}
                files={resolvedFiles.value[1]}
              />
              <props.editorComponent
                filename={store.activeConfigFile.filename}
                value={store.activeConfigFile.code}
                onChange={onConfigChange}
              />
            </div>
          </template>
        </SplitPane>

        <Message err={store.errors[0]} v-show="showMessage" />

        <div class="editor-floating">
          <ToggleButton
            v-if={editorOptions?.virtualFilesText !== false}
            v-model={virtualFiles}
            text={editorOptions?.virtualFilesText || 'Virtual Files'}
          />
          <ToggleButton
            v-if={editorOptions?.showErrorText !== false}
            v-model={showMessage}
            text={editorOptions?.showErrorText || 'Show Error'}
          />
        </div>
      </>
    )

    defineStyle(`
      .editor-container {
        height: 100%;
        overflow: hidden;
        position: relative;
      }
      
      .editor-floating {
        position: absolute;
        bottom: 16px;
        right: 16px;
        z-index: 11;
        display: flex;
        flex-direction: column;
        align-items: end;
        gap: 8px;
        background-color: var(--bg);
        color: var(--text-light);
        padding: 8px;
      }
    `)
  },
  // TODO should be removed
  { props: ['editorComponent'] },
)
