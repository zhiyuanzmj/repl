export default defineEventHandler(async (event) => {
  const [username, name] = getRouterParam(event, 'name').split('/')
  const data = await prisma.project.findFirst({
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
    where: {
      name: name ?? username,
      user: username && {
        username,
      },
    },
  })
  return data
})
