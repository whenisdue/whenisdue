import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getSeriesWithOccurrences(seriesKey: string) {
  // Safety Guard: stop execution if the key is missing or not a string
  if (!seriesKey || typeof seriesKey !== 'string') return null;

  return await prisma.series.findUnique({
    where: { seriesKey: seriesKey },
    include: {
      occurrences: {
        orderBy: { date: 'desc' },
        take: 12,
      },
    },
  });
}