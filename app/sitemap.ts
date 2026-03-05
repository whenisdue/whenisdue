import { MetadataRoute } from 'next';
import fs from 'node:fs/promises';
import path from 'node:path';

async function loadEvents() {
  try {
    // FIXED: Using process.cwd() ensures it works on Vercel and local
    const jsonPath = path.join(process.cwd(), "data/events.json");
    const raw = await fs.readFile(jsonPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Sitemap Loader Error:", e);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://whenisdue.com';
  const now = new Date();

  // 1. Static Routes
  const routes = ['', '/federal', '/about', '/terms'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 1.0,
  }));

  // 2. Dynamic Event Routes from JSON
  const events = await loadEvents();
  const eventRoutes = events.map((evt: any) => ({
    url: `${baseUrl}/${evt.category || 'federal'}/${evt.slug}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));

  // We are skipping the Database Series query entirely to bypass 
  // the 'occurrences' and 'updatedAt' schema errors.
  return [...routes, ...eventRoutes];
}