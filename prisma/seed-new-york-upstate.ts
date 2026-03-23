import { PrismaClient, TriggerType, DateOffsetStrategy, CohortType } from '@prisma/client';
const prisma = new PrismaClient();

type UpstateSeedRule = { s: string; e: string; d: number };

function validateUpstateSeed(rules: UpstateSeedRule[]) {
  const map = new Array(26).fill(0);
  rules.forEach(r => {
    const startIdx = r.s.toUpperCase().charCodeAt(0) - 65;
    const endIdx = r.e.toUpperCase().charCodeAt(0) - 65;
    for (let i = startIdx; i <= endIdx; i++) map[i]++;
  });
  if (!map.every(count => count === 1)) throw new Error("UPSTATE SEED: Alphabet coverage is not exactly-once.");
}

async function main() {
  const ny = await prisma.state.upsert({
    where: { abbreviation: "NY" },
    update: { name: "New York", slug: "new-york" },
    create: { name: "New York", slug: "new-york", abbreviation: "NY" }
  });

  const snap = await prisma.program.upsert({
    where: { program_identity: { stateId: ny.id, name: "SNAP" } },
    update: {},
    create: { stateId: ny.id, name: "SNAP", category: "BENEFIT" }
  });

  const upstateRules: UpstateSeedRule[] = [
    { s: "A", e: "B", d: 1 }, { s: "C", e: "E", d: 2 }, { s: "F", e: "H", d: 3 },
    { s: "I", e: "L", d: 4 }, { s: "M", e: "O", d: 5 }, { s: "P", e: "R", d: 6 },
    { s: "S", e: "S", d: 7 }, { s: "T", e: "V", d: 8 }, { s: "W", e: "Z", d: 9 }
  ];

  validateUpstateSeed(upstateRules);

  await prisma.rule.deleteMany({
    where: { programId: snap.id, cohortKey: CohortType.UPSTATE }
  });

  for (const r of upstateRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        cohortKey: CohortType.UPSTATE,
        triggerType: TriggerType.ALPHABETIC_RANGE,
        triggerStart: r.s,
        triggerEnd: r.e,
        baseDay: r.d,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY
      }
    });
  }
  console.log("✅ New York Upstate: Seeded and Verified.");
}

main().catch(e => { console.error(e.message); process.exit(1); });