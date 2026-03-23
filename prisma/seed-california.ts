import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Self-Healing California (CalFresh) Seed...");

  // 1. Ensure State Exists
  const ca = await prisma.state.upsert({
    where: { abbreviation: "CA" },
    update: { name: "California", slug: "california" },
    create: { name: "California", slug: "california", abbreviation: "CA" }
  });

  // 2. 🛡️ SELF-HEALING: Ensure Program Exists
  const snap = await prisma.program.upsert({
    where: { 
      program_identity: { stateId: ca.id, name: "SNAP" } 
    },
    update: {},
    create: { 
      stateId: ca.id, 
      name: "SNAP",
      category: "BENEFIT" 
    }
  });

  // 3. Define the 10-day staggered rules
  const caRules = [
    { s: "1", d: 1 }, { s: "2", d: 2 }, { s: "3", d: 3 }, { s: "4", d: 4 }, { s: "5", d: 5 },
    { s: "6", d: 6 }, { s: "7", d: 7 }, { s: "8", d: 8 }, { s: "9", d: 9 }, { s: "0", d: 10 }
  ];

  // 4. Clean existing CA rules
  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  // 5. Inject verified CalFresh logic
  for (const r of caRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.s,
        baseDay: r.d,
        offsetStrategy: DateOffsetStrategy.EXACT_CALENDAR_DATE,
        sourceCitation: "CDSS CalFresh Handbook - Section 63-503.4"
      }
    });
  }

  console.log("✅ California: Case Number Logic Seeded Successfully.");
}

main()
  .catch(e => { 
    console.error("❌ SEED FAILED:", e.message); 
    process.exit(1); 
  })
  .finally(async () => { 
    await prisma.$disconnect(); 
  });