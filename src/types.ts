import type { ComputedRef, FunctionalComponent, InjectionKey, ToRefs } from 'vue'
import type { Props } from './Repl'

export type EditorMode = 'js' | 'css' | 'ssr' | 'ts' | 'devtools'
export interface EditorProps {
  value: string
  filename: string
  readonly?: boolean
  mode?: EditorMode
  onChange?: (code: string) => void
}
export type EditorComponentType = FunctionalComponent<EditorProps>

export type OutputModes = EditorMode

export const injectKeyProps: InjectionKey<
  ToRefs<Required<Props & { autoSave: boolean; virtualFiles: boolean }>>
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
