import type { User } from '@prisma/client'

export async function getUserInfo(event) {
  const password = getCookie(event, 'token')

  const session = await prisma.session.findFirst({
    where: {
      id: password,
      status: true,
    },
  })
  if (!session) {
    setCookie(event, 'token', '')
    return createError({ statusCode: 401 })
  }

  await prisma.session.update({
    data: { count: session.count + 1 },
    where: { id: session.id },
  })

  const user = await useSession<User>(event, { name: 'user', password })
  if (!user.data.id) {
    await user.update(
      await prisma.user.findUnique({
        where: {
          id: session.userId,
        },
        omit: {
          password: false,
        },
      }),
    )
  }
  return user.data
}

export default eventHandler(getUserInfo)
