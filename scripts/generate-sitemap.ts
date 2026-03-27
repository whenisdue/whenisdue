import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();
const BASE_URL = 'https://whenisdue.com';

async function main() {
  console.log("🔍 Fetching all 5,000+ event slugs for sitemap...");
  
  const events = await prisma.event.findMany({
    select: { slug: true, updatedAt: true },
    where: { category: 'STATE' }
  });

  console.log(`📦 Found ${events.length} indexable pages. Building XML...`);

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${events.map(event => `
    <url>
      <loc>${BASE_URL}/s/snap/${event.slug}</loc>
      <lastmod>${new Date(event.updatedAt).toISOString()}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.6</priority>
    </url>`).join('')}
</urlset>`;

  fs.writeFileSync('./public/sitemap-events.xml', sitemap);
  console.log("✅ Sitemap generated at ./public/sitemap-events.xml");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());