import { defineComponent } from 'vue'
import Monaco from '../monaco/Monaco'
import type { EditorProps } from '../types'

export default defineComponent(
  ({ filename, value, readonly, onChange }: EditorProps) => {
    const change = (code: string) => {
      onChange(code)
    }

    return () => (
      <Monaco
        filename={filename}
        readonly={readonly}
        value={value}
        onChange={change}
      />
    )
  },
)
