import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Hydrating Florida SEO Metadata...");
  
  if (!fs.existsSync('./data/florida_seo_2026.json')) {
    throw new Error("❌ Metadata file not found. Run the generator script first.");
  }

  const rawData = fs.readFileSync('./data/florida_seo_2026.json', 'utf-8');
  const metadata = JSON.parse(rawData);
  const slugs = Object.keys(metadata);

  let updatedCount = 0;

  for (const slug of slugs) {
    const data = metadata[slug];
    
    const result = await prisma.event.updateMany({
      where: { slug: slug },
      data: {
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        keywords: data.keywords
      }
    });

    if (result.count > 0) updatedCount++;
  }

  console.log(`✨ Successfully hydrated ${updatedCount} Florida events with SEO metadata.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });