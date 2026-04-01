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

  // web/scripts/seed-phase29.ts
// --- SURGICAL REPLACEMENT START ---
  for (const s of newSeries) {
    await prismaPhase29.eventSeries.upsert({
      where: { slugBase: s.key },
      update: { description: s.rule },
      create: {
        slugBase: s.key,
        title: s.name,
        sourceName: s.entity,
        category: 'FEDERAL', 
        description: s.rule
      }
    });
  }
// --- SURGICAL REPLACEMENT END ---
//   console.log("✅ Phase 29 Series Seeded (OPM & VA).");
}

runSeed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaPhase29.$disconnect();
  });