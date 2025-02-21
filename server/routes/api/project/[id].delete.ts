export default defineEventHandler(async (event) => {
  return await prisma.project.delete({
    where: {
      id: getRouterParam(event, 'id'),
    },
  })
})
