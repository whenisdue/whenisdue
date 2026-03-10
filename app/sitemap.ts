import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://whenisdue.com';

// Ensure the sitemap revalidates every hour to catch new admin-generated events
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Static & Hub Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/federal', '/gaming', '/shopping', '/tech', '/about', '/terms', '/directory'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // 2. Dynamic Event Routes from Prisma
    const events = await prisma.event.findMany({
      select: { slug: true, category: true, updatedAt: true }
    });

    const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${BASE_URL}/${e.category.toLowerCase()}/${e.slug}`,
      lastModified: e.updatedAt || now,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    }));

    // 3. Dynamic Series Routes (Evergreen Pages)
    const series = await prisma.eventSeries.findMany({
      where: { isActive: true },
      select: { slugBase: true, category: true, updatedAt: true },
    });

    const seriesRoutes: MetadataRoute.Sitemap = series.map((item) => ({
      url: `${BASE_URL}/${item.category.toLowerCase()}/${item.slugBase}`,
      lastModified: item.updatedAt || now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...eventRoutes, ...seriesRoutes];
  } catch (error) {
    console.error("Sitemap generation failed, falling back to static routes:", error);
    return staticRoutes;
  }
}