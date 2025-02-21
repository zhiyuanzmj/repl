import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

export const prisma = new PrismaClient({
  errorFormat: 'minimal',
}).$extends(withAccelerate())
