import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { STATE_REGISTRY } from "@/src/lib/states-data"; // Import your registry

const BASE_URL = 'https://www.whenisdue.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core Static Routes
  const staticRoutes: MetadataRoute.Sitemap = [
    '', '/agencies'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  }));

  // 2. The 50 State Routes (Ensures they are ALWAYS indexed)
  const stateRoutes: MetadataRoute.Sitemap = Object.values(STATE_REGISTRY).map((state) => ({
    url: `${BASE_URL}/states/${state.slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  try {
    // 3. Dynamic Individual Event Routes
    const events = await prisma.event.findMany({
      where: { isArchived: false },
      select: { slug: true, category: true, updatedAt: true }
    });

    const eventRoutes: MetadataRoute.Sitemap = events.map((e) => ({
      url: `${BASE_URL}/${e.category.toLowerCase()}/${e.slug}`,
      lastModified: e.updatedAt || now,
      changeFrequency: 'daily',
      priority: 0.7,
    }));

    return [...staticRoutes, ...stateRoutes, ...eventRoutes];
  } catch (error) {
    return [...staticRoutes, ...stateRoutes];
  }
}