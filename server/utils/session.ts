import type { H3Event } from 'h3'

export function getSession<T = any>(event: H3Event, name = 'user') {
  return event.context.sessions?.[name].data as T
}
