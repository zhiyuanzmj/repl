export default defineEventHandler(async (event) => {
  const password = getCookie(event, 'token')

  const session = await prisma.session.findFirst({
    where: {
      id: password,
      status: true,
    },
  })
  if (session) {
    await prisma.session.update({
      data: { status: false },
      where: { id: session.id },
    })
  }
  setCookie(event, 'token', '')
})
