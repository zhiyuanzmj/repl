import { diffCleanupSemantic, diffMain } from 'diff-match-patch-es'
import { injectKeyProps } from '../types'
import type { Position, editor } from 'monaco-editor-core'

function calculateDiff(left: string, right: string) {
  const changes = diffMain(left, right)
  diffCleanupSemantic(changes)
  return changes
}

export const useDiff = () => {
  const { store } = $inject(injectKeyProps)!

  let { activeFile, editor, outputEditor } = $(store)

  const editorModel = $computed(() => editor?.getModel())
  const outputEditorModel = $computed(() => outputEditor?.getModel())

  const decorations: editor.IEditorDecorationsCollection[] = []

  watch(
    () => activeFile.editorCode,
    () => {
      decorations.forEach((i) => i.clear())
      if (
        !(editor && outputEditor && editorModel && outputEditorModel) ||
        !activeFile.compiledName
      )
        return
      const changes = calculateDiff(
        editorModel.getValue(),
        outputEditorModel.getValue(),
      )
      const addedLines = new Set<number>()
      const removedLines = new Set<number>()
      const addedInlinePos: { start: Position; end: Position }[] = []
      const removedInlinePos: { start: Position; end: Position }[] = []

      let indexL = 0
      let indexR = 0
      changes.forEach(([type, change]) => {
        if (type === 1) {
          const start = outputEditorModel.getPositionAt(indexR)
          indexR += change.length
          const end = outputEditorModel.getPositionAt(indexR)
          addedInlinePos.push({ start, end })
          for (let i = start.lineNumber; i <= end.lineNumber; i++)
            addedLines.add(i)
        } else if (type === -1) {
          const start = editorModel.getPositionAt(indexL)
          indexL += change.length
          const end = editorModel.getPositionAt(indexL)
          addedInlinePos.push({ start, end })
          for (let i = start.lineNumber; i <= end.lineNumber; i++)
            removedLines.add(i)
        } else {
          indexL += change.length
          indexR += change.length
        }
      })

      decorations[0] = editor.createDecorationsCollection([
        ...removedInlinePos.map(({ start, end }) => ({
          range: {
            startLineNumber: start.lineNumber,
            endLineNumber: end.lineNumber,
            startColumn: start.column,
            endColumn: end.column,
          },
          options: { className: 'diff-removed-inline' },
        })),
        ...[...removedLines].map((line) => ({
          range: {
            startLineNumber: line,
            endLineNumber: line + 1,
            startColumn: 1,
            endColumn: 1,
          },
          options: { className: 'diff-removed' },
        })),
      ])

      decorations[1] = outputEditor.createDecorationsCollection([
        ...addedInlinePos.map(({ start, end }) => ({
          range: {
            startLineNumber: start.lineNumber,
            endLineNumber: end.lineNumber,
            startColumn: start.column,
            endColumn: end.column,
          },
          options: { className: 'diff-added-inline' },
        })),
        ...[...addedLines].map((line) => ({
          range: {
            startLineNumber: line,
            endLineNumber: line + 1,
            startColumn: 1,
            endColumn: 1,
          },
          options: { className: 'diff-added' },
        })),
      ])
    },
    { immediate: true },
  )
}

defineStyle(`
  .diff-added {
    --at-apply: bg-green-400/15;
  }
  .diff-removed {
    --at-apply: bg-red-400/15;
  }
  .diff-added-inline {
    --at-apply: bg-green-400/30;
  }
  .diff-removed-inline {
    --at-apply: bg-red-400/30;
  }
`)
