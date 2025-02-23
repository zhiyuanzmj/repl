export default eventHandler(async (event) => {
  const [userName, name] = getRouterParam(event, 'name').split('/')
  const data = await readBody(event)
  return await prisma.project.update({
    data,
    where: {
      name_userName: {
        name,
        userName,
      },
    },
  })
})
