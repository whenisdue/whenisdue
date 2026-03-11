import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whenisdue.com';

// Ensure the sitemap revalidates every hour to catch new programmatic events
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core Static Routes (Cleaned up: removed dead gaming/tech links)
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/agencies'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'hourly' : 'daily',
    priority: route === '' ? 1.0 : 0.9,
  }));

  try {
    // 2. Dynamic Event Routes (The 50+ Programmatic State Pages)
    const events = await prisma.event.findMany({
      where: { isArchived: false },
      select: { slug: true, category: true, updatedAt: true }
    });

    const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${BASE_URL}/${e.category.toLowerCase()}/${e.slug}`,
      lastModified: e.updatedAt || now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticRoutes, ...eventRoutes];
  } catch (error) {
    console.error("Sitemap generation failed, falling back to static routes:", error);
    return staticRoutes;
  }
}