import * as monaco from 'monaco-editor-core'
import { initMonaco } from './env'
import { getOrCreateModel } from './utils'
import { type EditorMode, injectKeyProps } from '../types'
import { registerHighlighter } from './highlight'
import { useRef } from 'vue-jsx-vapor'

export default defineVaporComponent(
  ({
    filename = ''!,
    readonly = false,
    value = '',
    mode = undefined as unknown as EditorMode,
    onChange = (value: string) => {},
  }) => {
    let containerRef = $useRef()
    let editor = $shallowRef<monaco.editor.IStandaloneCodeEditor>()
    const { store, autoSave, editorOptions } = $inject(injectKeyProps)!

    initMonaco(store)

    const lang = $computed(() => (mode === 'css' ? 'css' : 'javascript'))

    let editorInstance: monaco.editor.IStandaloneCodeEditor

    monaco.languages.setLanguageConfiguration('javascript', {
      comments: {
        blockComment: ['{/*', '*/}'],
      },
    })

    function emitChangeEvent() {
      store.fileCaches[filename] = ''
      onChange(editorInstance.getValue())
    }

    onMounted(() => {
      const theme = registerHighlighter()
      if (!containerRef) {
        throw new Error('Cannot find containerRef')
      }
      editorInstance = monaco.editor.create(containerRef, {
        ...(readonly ? { value: value, language: lang } : { model: null }),
        fontSize: 13,
        tabSize: 2,
        theme: store.theme === 'light' ? theme.light : theme.dark,
        readOnly: readonly,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        minimap: {
          enabled: false,
        },
        inlineSuggest: {
          enabled: false,
        },
        fixedOverflowWidgets: true,
        ...editorOptions.monacoOptions,
      })
      editor = editorInstance

      // Support for semantic highlighting
      const t = (editorInstance as any)._themeService._theme
      t.semanticHighlighting = true
      t.getTokenStyleMetadata = (
        type: string,
        modifiers: string[],
        _language: string,
      ) => {
        const _readonly = modifiers.includes('readonly')
        switch (type) {
          case 'function':
          case 'method':
            return { foreground: 12 }
          case 'class':
            return { foreground: 11 }
          case 'variable':
          case 'property':
            return { foreground: _readonly ? 19 : 9 }
          default:
            return { foreground: 0 }
        }
      }

      watch(
        () => value,
        (value) => {
          if (editorInstance.getValue() === value) return
          editorInstance.setValue(value || '')
        },
        { immediate: true },
      )

      watch(
        () => lang,
        (lang) =>
          monaco.editor.setModelLanguage(editorInstance.getModel()!, lang),
      )

      if (!readonly) {
        watch(
          () => filename,
          (_, oldFilename) => {
            if (!editorInstance) return
            const file = store.files[filename]
            if (!file) return null
            const model = getOrCreateModel(
              monaco.Uri.parse(`file:///${filename}`),
              file.language,
              file.code,
            )

            const oldFile = oldFilename ? store.files[oldFilename] : null
            if (oldFile) {
              oldFile.editorViewState = editorInstance.saveViewState()
            }

            editorInstance.setModel(model)

            if (file.editorViewState) {
              editorInstance.restoreViewState(file.editorViewState)
              editorInstance.focus()
            }
          },
          { immediate: true },
        )
      }

      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          // ignore save event
        },
      )

      watch(
        () => autoSave,
        (autoSave) => {
          const disposable = editorInstance.onDidChangeModelContent((e) => {
            if (e.isFlush) return
            if (autoSave) {
              emitChangeEvent()
            } else {
              store.fileCaches[filename] = editorInstance.getValue()
            }
          })
          onWatcherCleanup(() => disposable.dispose())
        },
        { immediate: true },
      )

      // update theme
      watch(
        () => store.theme,
        (n) => {
          editorInstance.updateOptions({
            theme: n === 'light' ? theme.light : theme.dark,
          })
        },
      )
    })

    onBeforeUnmount(() => {
      editor?.dispose()
    })

    return (
      <div
        ref={(e) => {
          containerRef = e
          containerRef.addEventListener('keydown', (e) => {
            if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              emitChangeEvent()
            }
          })
        }}
        class="editor"
      />
    )
  },
)

defineStyle(`
  .editor {
    position: relative;
    height: calc(100% - 38px);
    width: 100%;
    overflow: hidden;
  }
`)
