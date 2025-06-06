export default defineEventHandler(async (event) => {
  const [userName, name] = getRouterParam(event, 'name').split('/')
  const data = await prisma.project.findFirst({
    where: {
      name,
      userName,
    },
  })
  return data
})
