export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return await prisma.project.create({
    data: {
      hash: body.hash,
      name: body.name,
      userId: body.userId,
    },
  })
})
