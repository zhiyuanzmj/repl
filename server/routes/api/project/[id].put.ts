import { User } from '@prisma/client'

export default eventHandler(async (event) => {
  return await prisma.project.update({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    data: await readBody(event),
    where: {
      id: getRouterParam(event, 'id'),
      userId: getSession<User>(event).id,
    },
  })
})
