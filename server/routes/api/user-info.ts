import type { User } from '@prisma/client'

export async function getUserInfo(event) {
  const password = getCookie(event, 'token')
  const user = await useSession<User>(event, { name: 'user', password })
  if (!user) {
    throw createError({ statusCode: 401 })
  }
  if (!user.data.id) {
    await user.update(
      await prisma.user.findUnique({
        where: {
          id: password,
        },
      }),
    )
  }
  return user.data
}

export default eventHandler(getUserInfo)
