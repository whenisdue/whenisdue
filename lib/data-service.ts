import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function getSeriesWithOccurrences(seriesKey: string) {
  // Safety Guard: stop execution if the key is missing or not a string
  if (!seriesKey || typeof seriesKey !== 'string') return null;

  // web/lib/data-service.ts
return await prisma.eventSeries.findUnique({
  where: { id: seriesKey }, // or { slugBase: seriesKey } depending on what you pass
  include: {
    events: { // Changed from 'occurrences' to 'events'
      orderBy: { dueAt: 'desc' }, // Changed from 'date' to 'dueAt'
      take: 12,
    },
  },
});
}