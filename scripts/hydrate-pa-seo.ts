import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: SEO HYDRATION
 * Goal: Inject CTR-optimized Meta Tags into 120 Pennsylvania records.
 */

async function main() {
  // 1. Load the JSON data
  const dataPath = path.join(process.cwd(), '../data/pennsylvania_snap_seo_2026.json');
  const seoData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`🎬 Hydrating SEO for ${seoData.length} Pennsylvania records...`);

  // Helper to map month names to keys used in slugs
  const monthMap: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
    July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
  };

  for (const item of seoData) {
    const monthKey = monthMap[item.month];
    // This slug must match the one generated in your seed: pennsylvania-snap-d0-m01-2026
    const targetSlug = `pennsylvania-snap-d${item.digit}-m${monthKey}-${item.year}`;

    await prisma.event.update({
      where: { slug: targetSlug },
      data: {
        seoTitle: item.title,
        seoDescription: item.description,
        keywords: `Pennsylvania SNAP, PA EBT dates 2026, Digit ${item.digit}, ${item.month} food stamps`
      }
    });
  }

  console.log("✨ SEO Hydration Complete. 120 records now optimized for search.");
}

main()
  .catch((e) => {
    console.error(`❌ Hydration Failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });