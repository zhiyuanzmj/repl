import { ofetch } from 'ofetch'
import { prisma } from '~/utils/prisma'

export default defineEventHandler(async (event) => {
  const params = getQuery(event)
  const { access_token } = await ofetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      responseType: 'json',
      headers: {
        accept: 'application/json',
      },
      params: {
        code: params.code,
        client_id: process.env.NITRO_CLIENT_ID,
        client_secret: process.env.NITRO_CLIENT_SECRET,
      },
    },
  )
  if (!access_token) return setResponseStatus(event, 401, 'No access token')
  const data = await ofetch('https://api.github.com/user', {
    headers: {
      accept: 'application/json',
      Authorization: `token ${access_token}`,
    },
  })

  let user = await prisma.user.findUnique({
    where: {
      githubId: data.id,
    },
  })
  if (!user) {
    user = await prisma.user.create({
      data: {
        githubId: data.id,
        username: data.name || data.login,
        email: data.email,
        avatar: data.avatar_url,
      },
    })
  }

  setCookie(event, 'token', user.id)

  return `<script>location.href='${getRequestProtocol(event) + '://' + getRequestHost(event)}'</script>`
})
