import { User } from '@prisma/client'

export default defineEventHandler(async (event) => {
  return await prisma.project.delete({
    where: {
      id: getRouterParam(event, 'id'),
      userId: getSession<User>(event).id,
    },
  })
})
