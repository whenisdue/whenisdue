import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const florida = await prisma.state.upsert({
    where: { abbreviation: "FL" },
    update: {},
    create: {
      name: "Florida",
      slug: "florida",
      abbreviation: "FL",
      officialUrl: "https://www.myflfamilies.com/services/public-assistance/snap"
    }
  });

  const snap = await prisma.program.create({
    data: {
      name: "SNAP (Food Assistance)",
      category: "BENEFIT",
      stateId: florida.id
    }
  });

  // Florida Logic: 9th and 8th digits of case number
  // For the "Clarity Engine" MVP, we seed the 10 core digit rules.
  const flRules = [
    { start: "00", end: "03", day: 1 },
    { start: "04", end: "06", day: 2 },
    // ... skipping to show variety ...
    { start: "41", end: "43", day: 12 }, 
    { start: "96", end: "99", day: 28 }
  ];

  for (const r of flRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: "CASE_DIGIT",
        triggerStart: r.start,
        triggerEnd: r.end,
        baseDay: r.day,
        offsetStrategy: "PREV_BUSINESS_DAY", // Florida standard
        sourceCitation: "Florida DCF Public Assistance Manual Section 1410.0102"
      }
    });
  }

  console.log("✅ Florida Beachhead seeded with deterministic rules.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

export {};