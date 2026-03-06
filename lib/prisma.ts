import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// This ensures we don't create multiple connections to your DB during development
export const prisma = 
  globalForPrisma.prisma || 
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma