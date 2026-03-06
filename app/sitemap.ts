import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://whenisdue.com';
  const now = new Date();

  // 1. Static & Hub Routes
  const staticRoutes = ['', '/federal', '/gaming', '/shopping', '/tech', '/about', '/terms'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // 2. Dynamic Event Routes from Prisma
  const events = await prisma.event.findMany({
    select: { slug: true, category: true, updatedAt: true }
  });

  const eventRoutes = events.map((e) => ({
    url: `${baseUrl}/${e.category.toLowerCase()}/${e.slug}`,
    lastModified: e.updatedAt || now,
    changeFrequency: 'hourly' as const, // Countdowns change often!
    priority: 0.8,
  }));

  return [...staticRoutes, ...eventRoutes];
}