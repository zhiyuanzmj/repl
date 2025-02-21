import { PrismaClient } from '@prisma/client/edge'

export const prisma = new PrismaClient({
  errorFormat: 'minimal',
})
