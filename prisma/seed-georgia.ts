import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Georgia (20-Day Stagger) Seed...");

  const ga = await prisma.state.upsert({
    where: { abbreviation: "GA" },
    update: { name: "Georgia", slug: "georgia" },
    create: { name: "Georgia", slug: "georgia", abbreviation: "GA" }
  });

  const snap = await prisma.program.upsert({
    where: { program_identity: { stateId: ga.id, name: "SNAP" } },
    update: {},
    create: { stateId: ga.id, name: "SNAP", category: "BENEFIT" }
  });

  // Georgia: Last 2 digits (00-99) map to 20 window days (5th - 23rd)
  // Logic: Digits 00-04 = 5th, 05-09 = 6th, etc.
  const gaRules = [];
  let currentDay = 5;
  for (let i = 0; i <= 99; i += 5) {
    gaRules.push({ 
      s: i.toString().padStart(2, '0'), 
      e: (i + 4).toString().padStart(2, '0'), 
      d: currentDay 
    });
    currentDay++;
  }

  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  for (const r of gaRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.s,
        triggerEnd: r.e,
        baseDay: r.d,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY, // Georgia shifts early
        sourceCitation: "Georgia DHS - Division of Family & Children Services"
      }
    });
  }

  console.log("✅ Georgia: 20-Day Logic Seeded.");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());