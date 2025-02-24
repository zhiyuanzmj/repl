export default defineEventHandler(async (event) => {
  const { userName } = getQuery<{ userName: string }>(event)
  return {
    data: await prisma.project.findMany({
      where: userName ? { userName } : { public: true },
      orderBy: {
        createdAt: 'asc',
      },
    }),
  }
})
