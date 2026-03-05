import { PrismaClient } from '@prisma/client';

const prismaClientForCycles = new PrismaClient();

async function runSeed() {
  const cycles = [
    { key: 'ssdi-cycle-1', name: 'SSDI (Birth 1st-10th)', bracket: '1ST_10TH', rule: 'SECOND_WEDNESDAY' },
    { key: 'ssdi-cycle-2', name: 'SSDI (Birth 11th-20th)', bracket: '11TH_20TH', rule: 'THIRD_WEDNESDAY' },
    { key: 'ssdi-cycle-3', name: 'SSDI (Birth 21st-31st)', bracket: '21ST_31ST', rule: 'FOURTH_WEDNESDAY' },
  ];

  for (const c of cycles) {
    await prismaClientForCycles.series.upsert({
      where: { seriesKey: c.key },
      update: { 
        bracket: c.bracket, 
        occurrenceRule: c.rule,
        canonicalName: c.name 
      },
      create: {
        seriesKey: c.key,
        canonicalName: c.name,
        entityName: 'Social Security Administration',
        frequency: 'MONTHLY',
        occurrenceRule: c.rule,
        bracket: c.bracket
      }
    });
  }
  console.log("✅ All SSA Cycles Seeded Successfully.");
}

runSeed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClientForCycles.$disconnect();
  });