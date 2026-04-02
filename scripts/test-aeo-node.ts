import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🏛️ Initializing Sovereign Truth Node...');

  const testEvent = await prisma.event.upsert({
    where: { slug: 'georgia-snap-april-2026' },
    update: {},
    create: {
      slug: 'georgia-snap-april-2026',
      title: 'Georgia SNAP Benefits - April 2026',
      category: 'STATE',
      dueAt: new Date('2026-04-05T00:00:00Z'),
      verificationStatus: 'OFFICIAL_API',
      confidenceScore: 0.99,
      sourceUrl: 'https://gateway.ga.gov/ebt-schedule',
      lastVerified: new Date(),
      shortSummary: 'Confirmed EBT issuance schedule for the state of Georgia.',
    },
  });

  console.log('✅ Truth Node Created:', testEvent.slug);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());