import { PrismaClient, TriggerType, DateOffsetStrategy, CohortType } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * 🛡️ THE VALIDATOR
 * Enforces numeric logic and ensures no ranges overlap.
 */
function validateTexasRules(rules: any[]) {
  const sorted = [...rules].sort((a, b) => parseInt(a.start) - parseInt(b.start));
  
  for (let i = 0; i < sorted.length; i++) {
    const r = sorted[i];
    const startNum = parseInt(r.start);
    const endNum = parseInt(r.end || r.start);

    if (isNaN(startNum) || isNaN(endNum)) throw new Error(`Invalid non-numeric trigger: ${r.start}`);
    if (startNum > endNum) throw new Error(`Reversed range detected: ${startNum} > ${endNum}`);
    
    if (i < sorted.length - 1) {
      const nextStart = parseInt(sorted[i+1].start);
      if (endNum >= nextStart) throw new Error(`Overlap detected: Range ${startNum}-${endNum} overlaps with next start ${nextStart}`);
    }
  }
}

async function main() {
  console.log("🚀 Starting Validated Texas Seed...");

  // 1. Fixed Lookup (TX, not FL)
  const texas = await prisma.state.upsert({
    where: { abbreviation: "TX" },
    update: { name: "Texas", slug: "texas" },
    create: { name: "Texas", slug: "texas", abbreviation: "TX" }
  });

  // 2. Stable Program Identity
  const snap = await prisma.program.upsert({
    where: { program_identity: { stateId: texas.id, name: "SNAP (Food Stamps)" } },
    update: {},
    create: { stateId: texas.id, name: "SNAP (Food Stamps)", category: "BENEFIT" }
  });

  // 3. The Data Sets
  const preRules = [
    { start: "0", end: "0", day: 1 }, { start: "1", end: "1", day: 2 }, 
    { start: "2", end: "2", day: 3 }, { start: "3", end: "3", day: 4 },
    { start: "4", end: "4", day: 5 }, { start: "5", end: "5", day: 6 },
    { start: "6", end: "6", day: 7 }, { start: "7", end: "7", day: 8 },
    { start: "8", end: "8", day: 9 }, { start: "9", end: "9", day: 10 }
  ];

  const postRules = [
    { start: "00", end: "07", day: 16 }, { start: "08", end: "15", day: 17 },
    { start: "16", end: "23", day: 18 }, { start: "24", end: "30", day: 19 },
    { start: "31", end: "38", day: 20 }, { start: "39", end: "46", day: 21 },
    { start: "47", end: "53", day: 22 }, { start: "54", end: "61", day: 23 },
    { start: "62", end: "69", day: 24 }, { start: "70", end: "76", day: 25 },
    { start: "77", end: "84", day: 26 }, { start: "85", end: "92", day: 27 },
    { start: "93", end: "99", day: 28 }
  ];

  // 4. Validate
  validateTexasRules(preRules);
  validateTexasRules(postRules);

  // 5. Clean & Inject
  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  console.log("Seeding PRE-2020 rules...");
  for (const r of preRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: CohortType.PRE_JUNE_2020, // 🚀 CRITICAL
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.start,
        triggerEnd: r.end,
        baseDay: r.day,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY,
        sourceCitation: "Texas Works Handbook B-250"
      }
    });
  }

  console.log("Seeding POST-2020 rules...");
  for (const r of postRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: CohortType.POST_JUNE_2020, // 🚀 CRITICAL
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.start,
        triggerEnd: r.end,
        baseDay: r.day,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY,
        sourceCitation: "Texas Works Handbook B-250 (Post-2020)"
      }
    });
  }

  console.log("✅ Texas Data Integrity Verified & Seeded.");
}

main()
  .catch(e => { console.error("❌ SEED FAILED:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });