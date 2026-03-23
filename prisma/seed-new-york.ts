import { PrismaClient, TriggerType, DateOffsetStrategy, CohortType } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Hardened New York Seed...");

  // 1. Stable State Lookup
  const ny = await prisma.state.upsert({
    where: { abbreviation: "NY" },
    update: { name: "New York", slug: "new-york" },
    create: { name: "New York", slug: "new-york", abbreviation: "NY" }
  });

  // 2. Stable Program Identity (Case-Insensitive lookup)
  const snap = await prisma.program.findFirst({
    where: { stateId: ny.id, name: { contains: "SNAP", mode: "insensitive" } }
  });

  if (!snap) throw new Error("❌ FATAL: SNAP program not found for NY. Run base seeds first.");

  // 3. Surgical Deletion (Preserves NYC data during Upstate updates)
  await prisma.rule.deleteMany({
    where: { 
      programId: snap.id, 
      cohortKey: { in: [CohortType.UPSTATE, CohortType.NYC_A_CYCLE, CohortType.NYC_B_CYCLE] } 
    }
  });

  // 4. UPSTATE: Surname Logic (A-Z)
  const upstate = [
    { s: "A", e: "B", d: 1 }, { s: "C", e: "E", d: 2 }, { s: "F", e: "H", d: 3 },
    { s: "I", e: "L", d: 4 }, { s: "M", e: "O", d: 5 }, { s: "P", e: "R", d: 6 },
    { s: "S", e: "S", d: 7 }, { s: "T", e: "V", d: 8 }, { s: "W", e: "Z", d: 9 }
  ];

  for (const r of upstate) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: CohortType.UPSTATE,
        triggerType: TriggerType.ALPHABETIC_RANGE,
        triggerStart: r.s, triggerEnd: r.e, baseDay: r.d,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY
      }
    });
  }

  // 5. NYC: Static Cycles (A & B)
  const nyc = [
    { c: CohortType.NYC_A_CYCLE, d: 1 },
    { c: CohortType.NYC_B_CYCLE, d: 2 }
  ];

  for (const r of nyc) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: r.c,
        triggerType: TriggerType.MONTHLY_STATIC,
        triggerStart: "STATIC", baseDay: r.d,
        offsetStrategy: DateOffsetStrategy.EXACT_CALENDAR_DATE
      }
    });
  }

  console.log("✅ New York Vertical: Upstate + NYC Cycles Seeded.");
}

main()
  .catch(e => {
    console.error("❌ NY SEED FAILED:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });