import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: CALIFORNIA CANONICAL SEED (V13)
 * Strategy: 100-Digit Inventory Expansion
 * Goal: 1,200 Indexable URLs (12 Months x 100 Digits)
 */

const getCaliforniaDay = (digit: number) => {
  // CA Logic: Last digit 1=Day 1, ..., 9=Day 9, 0=Day 10
  const lastDigit = digit % 10;
  return lastDigit === 0 ? 10 : lastDigit;
};

async function main() {
  console.log("🚀 Starting California 100-Digit Overhaul...");

  const ca = await prisma.state.upsert({
    where: { abbreviation: "CA" },
    update: { slug: "california" },
    create: { name: "California", slug: "california", abbreviation: "CA" }
  });

  const snap = await prisma.program.upsert({
    where: { program_identity: { stateId: ca.id, name: "SNAP" } },
    update: { category: "BENEFIT" },
    create: { stateId: ca.id, name: "SNAP", category: "BENEFIT" }
  });

  console.log("🧹 Cleaning old California rules...");
  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  console.log("📏 Seeding 100 individual rules (00-99)...");
  for (let i = 0; i <= 99; i++) {
    const d = i.toString().padStart(2, '0');
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: d,
        triggerEnd: d,
        baseDay: getCaliforniaDay(i),
        offsetStrategy: DateOffsetStrategy.EXACT_CALENDAR_DATE,
        cohortKey: 'STANDARD'
      }
    });
  }

  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `california-snap-2026` },
    update: {},
    create: {
      title: "California CalFresh (SNAP) Schedule 2026",
      slugBase: `california-snap-2026`,
      category: 'STATE' as any,
    }
  });

  console.log("📅 Generating 1,200 indexable events...");
  for (const m of Array.from({ length: 12 }, (_, i) => i + 1)) {
    const mk = m.toString().padStart(2, '0');
    for (let i = 0; i <= 99; i++) {
      const d = i.toString().padStart(2, '0');
      const depositDate = calculateSmartDate(
        { baseDay: getCaliforniaDay(i), offsetStrategy: 'EXACT_CALENDAR_DATE' as any },
        m,
        2026
      );
      const slug = `california-snap-d${d}-m${mk}-2026`;
      
      await prisma.event.upsert({
        where: { slug },
        update: { dueAt: depositDate },
        create: {
          seriesId: series.id,
          title: `California SNAP — Case ending in ${d}`,
          slug, 
          category: 'STATE' as any, 
          dueAt: depositDate,
          shortSummary: `Official CalFresh deposit date for California case numbers ending in ${d}.`,
          scheduleRules: { digit: d, agency: 'CDSS' } as any
        }
      });
    }
    console.log(`📍 California Month ${mk}/2026 Synchronized.`);
  }

  console.log("✅ California Overhaul Complete.");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });