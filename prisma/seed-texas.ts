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
  console.log("🚀 Starting Hardened & Corrected Texas Seed...");

  const texas = await prisma.state.upsert({
    where: { abbreviation: "TX" },
    update: { name: "Texas", slug: "texas" },
    create: { name: "Texas", slug: "texas", abbreviation: "TX" }
  });

  const snap = await prisma.program.findFirst({
    where: { stateId: texas.id, name: { contains: "SNAP", mode: "insensitive" } }
  });

  if (!snap) throw new Error("❌ SNAP program not found for Texas. Ensure base seeds ran.");

  // 1. DATASETS: Corrected for 2026 Stagger Logic
  // Pre-June 2020: 10-day cycle based on last digit (0-9)
  const preRules = [
    { start: "0", end: "0", day: 1 }, { start: "1", end: "1", day: 2 }, 
    { start: "2", end: "2", day: 3 }, { start: "3", end: "3", day: 4 },
    { start: "4", end: "4", day: 5 }, { start: "5", end: "5", day: 6 },
    { start: "6", end: "6", day: 7 }, { start: "7", end: "7", day: 8 },
    { start: "8", end: "8", day: 9 }, { start: "9", end: "9", day: 10 }
  ];

  // Post-June 2020: 10-day cycle based on last TWO digits (00-99)
  // 🚀 FIXED: Digit '00' now maps to Day 1, ensuring April 1st delivery.
  const postRules = [
    { start: "00", end: "09", day: 1 },
    { start: "10", end: "19", day: 2 },
    { start: "20", end: "29", day: 3 },
    { start: "30", end: "39", day: 4 },
    { start: "40", end: "49", day: 5 },
    { start: "50", end: "59", day: 6 },
    { start: "60", end: "69", day: 7 },
    { start: "70", end: "79", day: 8 },
    { start: "80", end: "89", day: 9 },
    { start: "90", end: "99", day: 10 }
  ];

  // 2. VALIDATE
  validateTexasRules(preRules);
  validateTexasRules(postRules);

  // 3. CLEAN & INJECT
  await prisma.rule.deleteMany({ 
    where: { 
      programId: snap.id,
      cohortKey: { in: [CohortType.PRE_JUNE_2020, CohortType.POST_JUNE_2020] }
    } 
  });

  console.log("Seeding Corrected PRE-2020 rules...");
  for (const r of preRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: CohortType.PRE_JUNE_2020,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.start,
        triggerEnd: r.end,
        baseDay: r.day,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY
      }
    });
  }

  console.log("Seeding Corrected POST-2020 rules...");
  for (const r of postRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: CohortType.POST_JUNE_2020,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.start,
        triggerEnd: r.end,
        baseDay: r.day,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY
      }
    });
  }

  console.log("✅ Texas Data Integrity Corrected & Seeded.");
}

main()
  .catch(e => { console.error("❌ SEED FAILED:", e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });