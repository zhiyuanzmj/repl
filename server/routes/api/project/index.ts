export default defineEventHandler(async (event) => {
  return {
    data: await prisma.project.findMany({
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      where: {
        userId: getRouterParam(event, 'id'),
      },
    }),
  }
})
