import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { STATE_REGISTRY } from "@/lib/states-data";

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: SEO INFRASTRUCTURE (PHASE 2)
 * Promotes verified 2026 verticals and boosts priority for SNAP utility events.
 */

const BASE_URL = 'https://www.whenisdue.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core Static Routes: Priority 1.0
  const staticRoutes: MetadataRoute.Sitemap = [
    '', 
    '/agencies',
    '/about',
    '/privacy',
    '/terms'
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 1.0,
  }));

  // 2. The 50 State Routes: Priority 0.7 - 0.9
  const stateRoutes: MetadataRoute.Sitemap = Object.values(STATE_REGISTRY).map((state) => {
    // 🛡️ DOCTOR STRANGE UPDATE: Added 'pennsylvania' to verified power-states
    const powerStates = ['california', 'florida', 'georgia', 'new-york', 'texas', 'pennsylvania'];
    const isPowerState = powerStates.includes(state.slug);

    return {
      url: `${BASE_URL}/states/${state.slug}`,
      lastModified: now,
      changeFrequency: isPowerState ? 'daily' : 'weekly',
      priority: isPowerState ? 0.9 : 0.7,
    };
  });

  try {
    // 3. Dynamic Individual Event Routes: Priority 0.6+
    const events = await prisma.event.findMany({
      where: { isArchived: false },
      select: { slug: true, category: true, updatedAt: true }
    });

    const eventRoutes: MetadataRoute.Sitemap = events.map((e) => {
      // 🛡️ DOCTOR STRANGE UPDATE: Boost SNAP events for aggressive indexing
      const isSnapEvent = e.slug.includes('-snap-');
      
      return {
        url: `${BASE_URL}/s/${e.category.toLowerCase()}/${e.slug}`,
        lastModified: e.updatedAt || now,
        changeFrequency: isSnapEvent ? 'daily' : 'weekly',
        priority: isSnapEvent ? 0.8 : 0.6,
      };
    });

    return [...staticRoutes, ...stateRoutes, ...eventRoutes];
  } catch (error) {
    console.error("⚠️ Sitemap dynamic fetch failed, falling back to static/registry.");
    return [...staticRoutes, ...stateRoutes];
  }
}