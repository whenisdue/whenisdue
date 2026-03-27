import { PrismaClient, TriggerType, DateOffsetStrategy, CohortType } from '@prisma/client';
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

const getTexasStandardDay = (digit: number) => {
  const map: Record<number, number> = { 0: 1, 1: 3, 2: 5, 3: 6, 4: 7, 5: 9, 6: 11, 7: 12, 8: 13, 9: 15 };
  return map[digit];
};

const getTexasModernDay = (digit: number) => {
  if (digit <= 3) return 16; if (digit <= 6) return 17; if (digit <= 10) return 18;
  if (digit <= 13) return 19; if (digit <= 17) return 20; if (digit <= 20) return 21;
  if (digit <= 24) return 22; if (digit <= 27) return 23; if (digit <= 31) return 24;
  if (digit <= 34) return 25; if (digit <= 38) return 26; if (digit <= 41) return 27;
  if (digit <= 45) return 28; if (digit <= 49) return 27; if (digit <= 53) return 28;
  if (digit <= 57) return 16; if (digit <= 60) return 17; if (digit <= 64) return 18;
  if (digit <= 67) return 19; if (digit <= 71) return 20; if (digit <= 74) return 21;
  if (digit <= 78) return 22; if (digit <= 81) return 23; if (digit <= 85) return 24;
  if (digit <= 88) return 25; if (digit <= 92) return 26; if (digit <= 95) return 27;
  return 28;
};

async function main() {
  console.log("🚀 Syncing Texas (Fixed Enum)...");

  const texas = await prisma.state.upsert({
    where: { abbreviation: "TX" },
    update: { slug: "texas" },
    create: { name: "Texas", slug: "texas", abbreviation: "TX" }
  });

  const snap = await prisma.program.findFirst({
    where: { stateId: texas.id, name: { contains: "SNAP", mode: "insensitive" } }
  });
  if (!snap) throw new Error("❌ SNAP program not found.");

  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  // 🛡️ FIX: Changed to PREV_BUSINESS_DAY to match the validator
  for (let i = 0; i <= 9; i++) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: i.toString(), triggerEnd: i.toString(),
        baseDay: getTexasStandardDay(i),
        offsetStrategy: 'PREV_BUSINESS_DAY' as any,
        cohortKey: CohortType.PRE_JUNE_2020
      }
    });
  }

  for (let i = 0; i <= 99; i++) {
    const d = i.toString().padStart(2, '0');
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: d, triggerEnd: d,
        baseDay: getTexasModernDay(i),
        offsetStrategy: 'PREV_BUSINESS_DAY' as any,
        cohortKey: CohortType.POST_JUNE_2020
      }
    });
  }

  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `texas-snap-2026` },
    update: {},
    create: { title: "Texas SNAP Schedule 2026", slugBase: `texas-snap-2026`, category: 'STATE' as any }
  });

  for (const m of Array.from({ length: 12 }, (_, i) => i + 1)) {
    const mk = m.toString().padStart(2, '0');
    for (let i = 0; i <= 99; i++) {
      const d = i.toString().padStart(2, '0');
      const depositDate = calculateSmartDate({ baseDay: getTexasModernDay(i), offsetStrategy: 'PREV_BUSINESS_DAY' as any }, m, 2026);
      const slug = `texas-snap-modern-d${d}-m${mk}-2026`;
      await prisma.event.upsert({
        where: { slug },
        update: { dueAt: depositDate },
        create: {
          seriesId: series.id, title: `Texas SNAP (Modern Group - Digits ${d})`,
          slug, category: 'STATE' as any, dueAt: depositDate,
          shortSummary: `Texas SNAP certified AFTER June 2020 with EDG ending in ${d}.`,
          scheduleRules: { digit: d, cohort: 'MODERN' } as any
        }
      });
    }
    console.log(`📍 Texas Month ${mk} Synced.`);
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });