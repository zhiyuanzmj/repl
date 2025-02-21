export function getSession<T = any>(event: any, name = 'user') {
  return event.context.sessions?.[name].data as T
}
