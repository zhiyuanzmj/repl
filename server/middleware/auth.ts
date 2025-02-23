import { getUserInfo } from '../routes/api/user-info'

export default eventHandler(async (event) => {
  const {
    node: { req },
  } = event
  const url = req.url.replace(/^\/api([^?#]*).*$/, '$1')

  if (
    (req.method === 'GET' && url.startsWith('/project')) ||
    ['/oauth/redirect'].includes(url)
  )
    return

  await getUserInfo(event)
})
