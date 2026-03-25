import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Hydrating Texas SEO Metadata...");
  
  const rawData = fs.readFileSync('./data/texas_seo_2026.json', 'utf-8');
  const metadata = JSON.parse(rawData);
  const slugs = Object.keys(metadata);

  let updatedCount = 0;

  for (const slug of slugs) {
    const data = metadata[slug];
    
    const event = await prisma.event.updateMany({
      where: { slug: slug },
      data: {
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        keywords: data.keywords
      }
    });

    if (event.count > 0) updatedCount++;
  }

  console.log(`✨ Successfully hydrated ${updatedCount} Texas events with SEO metadata.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });