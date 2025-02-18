import type { Component, ComputedRef, InjectionKey, ToRefs } from 'vue'
import { Props } from './Repl.vue'

export type EditorMode = 'js' | 'css' | 'ssr' | 'volar' | 'devtools'
export interface EditorProps {
  value: string
  filename: string
  readonly?: boolean
  mode?: EditorMode
}
export interface EditorEmits {
  (e: 'change', code: string): void
}
export type EditorComponentType = Component<EditorProps>

export type OutputModes = EditorMode

export const injectKeyProps: InjectionKey<
  ToRefs<Required<Props & { autoSave: boolean; virtualFiles: boolean }>>
> = Symbol('props')
export const injectKeyPreviewRef: InjectionKey<
  ComputedRef<HTMLDivElement | null>
> = Symbol('preview-ref')
