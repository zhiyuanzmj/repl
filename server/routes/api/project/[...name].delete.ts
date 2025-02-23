export default defineEventHandler(async (event) => {
  const [userName, name] = getRouterParam(event, 'name').split('/')
  return await prisma.project.delete({
    where: {
      name_userName: {
        name,
        userName,
      },
    },
  })
})
