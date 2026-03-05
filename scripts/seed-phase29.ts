import { PrismaClient } from '@prisma/client';

const prismaPhase29 = new PrismaClient();

async function runSeed() {
  const newSeries = [
    { 
      key: 'opm-retirement', 
      name: 'OPM Federal Retirement', 
      entity: 'Office of Personnel Management', 
      rule: 'OPM_FIRST_BUSINESS_DAY' 
    },
    { 
      key: 'va-disability', 
      name: 'VA Disability & Pension', 
      entity: 'Department of Veterans Affairs', 
      rule: 'VA_FIRST_BUSINESS_DAY_NEXT_MONTH' 
    },
  ];

  for (const s of newSeries) {
    await prismaPhase29.series.upsert({
      where: { seriesKey: s.key },
      update: { occurrenceRule: s.rule },
      create: {
        seriesKey: s.key,
        canonicalName: s.name,
        entityName: s.entity,
        frequency: 'MONTHLY',
        occurrenceRule: s.rule
      }
    });
  }
  console.log("✅ Phase 29 Series Seeded (OPM & VA).");
}

runSeed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaPhase29.$disconnect();
  });