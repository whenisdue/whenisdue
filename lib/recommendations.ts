import { prisma } from "./prisma";

export async function getRelatedEvents(currentEvent: { id: string; category: string; seriesId: string | null; dueAt: Date | null }) {
  if (!currentEvent.dueAt) return [];

  const [future, past] = await Promise.all([
    prisma.event.findMany({
      where: { category: currentEvent.category as any, dueAt: { gte: currentEvent.dueAt }, id: { not: currentEvent.id } },
      orderBy: { dueAt: "asc" },
      take: 3,
      select: { id: true, title: true, slug: true, dueAt: true, category: true, seriesId: true }
    }),
    prisma.event.findMany({
      where: { category: currentEvent.category as any, dueAt: { lt: currentEvent.dueAt }, id: { not: currentEvent.id } },
      orderBy: { dueAt: "desc" },
      take: 3,
      select: { id: true, title: true, slug: true, dueAt: true, category: true, seriesId: true }
    })
  ]);

  return [...future, ...past]
    .map((evt: any) => {
      let score = 100;
      if (evt.seriesId && evt.seriesId === currentEvent.seriesId) score += 50;
      const diffDays = Math.abs((evt.dueAt!.getTime() - currentEvent.dueAt!.getTime()) / (1000 * 60 * 60 * 24));
      score -= diffDays * 2;
      return { ...evt, relatedScore: score };
    })
    .sort((a: any, b: any) => b.relatedScore - a.relatedScore)
    .slice(0, 3);
}