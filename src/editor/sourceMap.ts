import type { editor } from 'monaco-editor-core'
import { injectKeyProps } from '../types'
import { SourceMap } from '@volar/source-map'
import { type MappingItem, SourceMapConsumer } from 'source-map-js'
import remapping from '@ampproject/remapping'

export const useSourceMap = () => {
  const { store, showSourceMap } = $inject(injectKeyProps)!

  const map = $computed(() =>
    store.activeFile.maps.length
      ? new SourceMapConsumer(
          store.activeFile.compiledName
            ? store.activeFile.maps[store.activeFile.compiledIndex]
            : store.activeFile.maps.length === 1
              ? store.activeFile.maps[0]
              : (remapping(
                  store.activeFile.maps.slice().reverse(),
                  () => null,
                ) as any),
        )
      : null,
  )
  const tsMap = $computed(() =>
    store.activeFile.compiled.tsMaps.length
      ? new SourceMap(store.activeFile.compiled.tsMaps)
      : null,
  )

  const editorModel = $computed(() => store.editor?.getModel())
  const outputEditorModel = $computed(() => store.outputEditor?.getModel())

  function getMapping() {
    if (store.outputMode === 'js') {
      if (!map) return []
      const mappings: MappingItem[] = []
      map.eachMapping((mapping) => {
        if (mapping.name) {
          mappings.push(mapping)
        }
      })
      return mappings
    } else {
      if (!tsMap) return []
      return tsMap.mappings
        .map((i) => {
          const originPosition = editorModel?.getPositionAt(i.sourceOffsets[0])
          if (!originPosition) return null
          const name = editorModel?.getValueInRange({
            startLineNumber: originPosition.lineNumber,
            endLineNumber: originPosition.lineNumber,
            startColumn: originPosition.column,
            endColumn: originPosition.column + i.lengths[0],
          })
          if (!name) return null
          const generatedPosition = editorModel?.getPositionAt(
            i.generatedOffsets[0],
          )
          if (!generatedPosition) return null
          return {
            originalLine: originPosition.lineNumber,
            originalColumn: originPosition.column - 1,
            generatedLine: generatedPosition.lineNumber,
            generatedColumn: generatedPosition.column - 1,
            name,
          }
        })
        .filter((i) => !!i)
    }
  }

  function generatedPositionFor(params: {
    source: string
    column: number
    line: number
  }) {
    if (store.outputMode === 'js') {
      const result = map?.generatedPositionFor(params)
      if (result) {
        result.column++
        return result
      }
    } else {
      const offset = editorModel?.getOffsetAt({
        lineNumber: params.line,
        column: params.column + 1,
      })
      if (!offset || !tsMap) return null
      const location = [...tsMap.toGeneratedLocation(offset)][0]
      if (!location) return null
      const result = outputEditorModel?.getPositionAt(
        location[1].generatedOffsets[0],
      )
      if (result) {
        return {
          line: result.lineNumber,
          column: result.column,
        }
      }
    }
  }

  function originalPositionFor(params: { column: number; line: number }) {
    if (store.outputMode === 'js') {
      const result = map?.originalPositionFor(params)
      if (result) {
        result.column++
        return result
      }
    } else {
      const offset = outputEditorModel?.getOffsetAt({
        lineNumber: params.line,
        column: params.column + 1,
      })
      if (!offset || !tsMap) return null
      const location = [...tsMap!.toSourceLocation(offset)][0]
      if (!location) return null
      const result = editorModel?.getPositionAt(location[1].sourceOffsets[0])
      if (result) {
        const name =
          editorModel?.getValueInRange({
            startLineNumber: result.lineNumber,
            endLineNumber: result.lineNumber,
            startColumn: result.column,
            endColumn: result.column + location[1].lengths[0],
          }) || ''
        return {
          line: result.lineNumber,
          column: result.column,
          name,
          source: '',
        }
      }
    }
  }

  const sourceMapDecorations: editor.IEditorDecorationsCollection[] = []
  watch(
    () => [showSourceMap, store.outputMode === 'js' ? map : tsMap],
    async ([showSourceMap, map]) => {
      await new Promise((resolve) => setTimeout(resolve))
      sourceMapDecorations.forEach((i) => i.clear())
      if (!showSourceMap || !map || !['js', 'ts'].includes(store.outputMode))
        return
      const maps = getMapping()
      if (!maps.length) return
      sourceMapDecorations[0] = store.editor?.createDecorationsCollection(
        maps.map((mapping) => ({
          range: {
            startLineNumber: mapping.originalLine!,
            endLineNumber: mapping.originalLine!,
            startColumn: mapping.originalColumn! + 1,
            endColumn: mapping.originalColumn! + 1 + mapping.name!.length,
          },
          options: {
            className: `outline-(1px solid gray4)`,
          },
        })),
      )!
      sourceMapDecorations[1] = store.outputEditor?.createDecorationsCollection(
        maps.map((mapping) => ({
          range: {
            startLineNumber: mapping.generatedLine,
            startColumn: mapping.generatedColumn + 1,
            endColumn: mapping.generatedColumn + 1 + mapping.name!.length,
            endLineNumber: mapping.generatedLine,
          },
          options: {
            className: `outline-(1px solid gray4)`,
          },
        })),
      )!
    },
    { immediate: true, flush: 'post' },
  )

  onMounted(async () => {
    await nextTick()
    let decorations: editor.IEditorDecorationsCollection[] = []
    store.editor?.onDidBlurEditorText(() => {
      decorations.forEach((i) => i?.clear())
    })
    store.editor?.onDidChangeCursorPosition((e) => {
      if (!['js', 'ts'].includes(store.outputMode)) return
      const generated = generatedPositionFor({
        source: map?.sources[0] || '',
        column: e.position.column - 1,
        line: e.position.lineNumber,
      })
      decorations.forEach((i) => i?.clear())
      if (!generated?.line) return
      const origin = originalPositionFor(generated)
      if (!origin?.name) return
      store.outputEditor?.revealPositionNearTop({
        lineNumber: generated.line,
        column: generated.column,
      })
      decorations[0] = store.editor?.createDecorationsCollection([
        {
          range: {
            startLineNumber: origin.line,
            startColumn: origin.column,
            endLineNumber: origin.line,
            endColumn: origin.column + origin.name!.length,
          },
          options: {
            className: 'outline-(1px solid orange)',
          },
        },
      ])!
      decorations[1] = store.outputEditor?.createDecorationsCollection([
        {
          range: {
            startLineNumber: generated.line,
            endLineNumber: generated.line,
            startColumn:
              generated.column + e.position.column - origin.column - 1,
            endColumn: generated.column + e.position.column - origin.column,
          },
          options: {
            className: 'cursor',
          },
        },
        {
          range: {
            startLineNumber: generated.line,
            endLineNumber: generated.line,
            startColumn: generated.column,
            endColumn: generated.column + origin.name.length,
          },
          options: {
            className: 'outline-(1px solid orange)',
          },
        },
      ])!
    })

    let outputDecorations: editor.IEditorDecorationsCollection[] = []
    store.outputEditor?.onDidBlurEditorText(() => {
      outputDecorations.forEach((i) => i?.clear())
    })
    store.outputEditor?.onDidChangeCursorPosition((e) => {
      const origin = originalPositionFor({
        column: e.position.column - 1,
        line: e.position.lineNumber,
      })
      if (!origin?.name) return
      const generated = generatedPositionFor(origin)
      if (!generated?.line) return
      outputDecorations.forEach((i) => i?.clear())
      store.editor?.revealPositionNearTop({
        lineNumber: origin.line,
        column: origin.column,
      })
      outputDecorations[0] = store.outputEditor?.createDecorationsCollection([
        {
          range: {
            startLineNumber: generated.line,
            endLineNumber: generated.line,
            startColumn: generated.column,
            endColumn: generated.column + origin.name!.length,
          },
          options: {
            className: 'outline-(1px solid orange)',
          },
        },
      ])!
      outputDecorations[1] = store.editor?.createDecorationsCollection([
        {
          range: {
            startLineNumber: origin.line,
            endLineNumber: origin.line,
            startColumn:
              origin.column + e.position.column - generated.column - 1,
            endColumn: origin.column + e.position.column - generated.column,
          },
          options: {
            className: 'cursor',
          },
        },
        {
          range: {
            startLineNumber: origin.line,
            endLineNumber: origin.line,
            startColumn: origin.column,
            endColumn: origin.column + origin.name!.length,
          },
          options: {
            className: 'outline-(1px solid orange)',
          },
        },
      ])!
    })
  })
}
