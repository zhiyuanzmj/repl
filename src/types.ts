import type { ComputedRef, InjectionKey, ToRefs } from 'vue'
import type Monaco from './monaco/Monaco'
import type { Props } from './Repl'

export type EditorMode =
  | 'js'
  | 'css'
  | 'ssr'
  | 'ts'
  | 'devtools'
  | 'ast'
  | 'sourcemap'
export interface EditorProps {
  value: string
  filename: string
  readonly?: boolean
  mode?: EditorMode
  onChange?: (code: string) => void
}
export type EditorComponentType = typeof Monaco

export type OutputModes = EditorMode

export const injectKeyProps: InjectionKey<
  ToRefs<
    Required<
      Props & {
        autoSave: boolean
        showVirtualFiles: boolean
        showSourceMap: boolean
      }
    >
  >
> = Symbol('props')
export const injectKeyPreviewRef: InjectionKey<
  ComputedRef<HTMLDivElement | null>
> = Symbol('preview-ref')

export type User = {
  id: string
  name: string
  avatar?: string
  role: 'USER' | 'ADMIN'
}

export type Project = {
  id: string
  name: string
  hash: string
  userId: string
  userName: string
  public: boolean
  originName: string
  editing?: boolean
}

export interface Organization {
  login: string
  id: number
  node_id: string
  url: string
  repos_url: string
  events_url: string
  hooks_url: string
  issues_url: string
  members_url: string
  public_members_url: string
  avatar_url: string
  description: string
}
