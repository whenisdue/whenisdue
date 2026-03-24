import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: GEORGIA SEO HYDRATION
 * Matches 100-digit granularity for Georgia Gateway / DFCS.
 */

async function main() {
  // 🛡️ FIX 1: Ensure path correctly targets the root /data folder from web/scripts
  const dataPath = path.join(process.cwd(), '../data/georgia_snap_january_2026.json');
  
  if (!fs.existsSync(dataPath)) {
    throw new Error(`File not found at ${dataPath}. Ensure the JSON is in the root data/ folder.`);
  }

  const seoData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  console.log(`🎬 Hydrating SEO for ${seoData.length} Georgia Gateway records...`);

  const monthMap: Record<string, string> = {
    January: '01', February: '02', March: '03', April: '04', May: '05', June: '06',
    July: '07', August: '08', September: '09', October: '10', November: '11', December: '12'
  };

  for (const item of seoData) {
    const monthKey = monthMap[item.month];
    // 🛡️ FIX 2: Ensure digit is treated as a 2-character string (00, 01, etc.)
    const digitStr = item.digit.toString().padStart(2, '0');
    const targetSlug = `georgia-snap-d${digitStr}-m${monthKey}-${item.year}`;

    try {
      await prisma.event.update({
        where: { slug: targetSlug },
        data: {
          seoTitle: item.title,
          seoDescription: item.description,
          keywords: `Georgia SNAP, GA Gateway, DFCS, EBT dates 2026, ID ending ${digitStr}`
        }
      });
    } catch (error) {
      console.warn(`⚠️ Could not find event with slug: ${targetSlug}. Skipping.`);
    }
  }

  console.log(`✨ Georgia SEO Hydration Complete. ${seoData.length} records optimized.`);
}

main()
  .catch((e) => {
    console.error(`❌ Hydration Failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });