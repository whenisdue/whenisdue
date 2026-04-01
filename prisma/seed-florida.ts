import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: FLORIDA CANONICAL SEED (V14)
 * Strategy: 100-Digit "Interpreted" Logic (Backward Reading)
 * Goal: Fix Georgia identity crisis and maintain 1,200 indexable pages.
 */

const getFloridaDay = (interpreted: number) => {
  // Florida Logic: Grouped by interpreted digits
  if (interpreted <= 3) return 1; if (interpreted <= 6) return 2; if (interpreted <= 9) return 3;
  if (interpreted <= 12) return 4; if (interpreted <= 15) return 5; if (interpreted <= 18) return 6;
  if (interpreted <= 21) return 7; if (interpreted <= 24) return 8; if (interpreted <= 27) return 9;
  if (interpreted <= 30) return 10; if (interpreted <= 33) return 11; if (interpreted <= 36) return 12;
  if (interpreted <= 39) return 13; if (interpreted <= 42) return 14; if (interpreted <= 45) return 15;
  if (interpreted <= 48) return 16; if (interpreted <= 51) return 17; if (interpreted <= 54) return 18;
  if (interpreted <= 57) return 19; if (interpreted <= 60) return 20; if (interpreted <= 63) return 21;
  if (interpreted <= 66) return 22; if (interpreted <= 69) return 23; if (interpreted <= 72) return 24;
  if (interpreted <= 75) return 25; if (interpreted <= 78) return 26; if (interpreted <= 81) return 27;
  if (interpreted <= 84) return 28; 
  return 28; 
};

async function main() {
  console.log("🚀 Starting Florida Identity Correction...");

  const florida = await prisma.state.upsert({
    where: { abbreviation: "FL" },
    update: { slug: "florida" },
    create: { name: "Florida", slug: "florida", abbreviation: "FL" }
  });

  const snap = await prisma.program.upsert({
    where: { program_identity: { stateId: florida.id, name: "SNAP" } },
    update: { category: "BENEFIT" },
    create: { stateId: florida.id, name: "SNAP", category: "BENEFIT" }
  });

  console.log("🧹 Cleaning old Florida rules...");
  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  console.log("📏 Seeding 100 interpreted rules (00-99)...");
  for (let i = 0; i <= 99; i++) {
    const d = i.toString().padStart(2, '0');
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: d,
        triggerEnd: d,
        baseDay: getFloridaDay(i),
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY,
        cohortKey: 'STANDARD'
      }
    });
  }

  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `florida-snap-2026` },
    update: {},
    create: {
      title: "Florida SNAP (MyACCESS) Schedule 2026",
      slugBase: `florida-snap-2026`,
      category: 'STATE' as any,
    }
  });

  console.log("📅 Generating 1,200 indexable events with CORRECT agency...");
  for (const m of Array.from({ length: 12 }, (_, i) => i + 1)) {
    const mk = m.toString().padStart(2, '0');
    for (let i = 0; i <= 99; i++) {
      const interpreted = i.toString().padStart(2, '0');
      const rawExample = interpreted.split('').reverse().join('');
      const depositDate = calculateSmartDate(
        { baseDay: getFloridaDay(i), offsetStrategy: 'PREV_BUSINESS_DAY' as any },
        m,
        2026
      );
      const slug = `florida-snap-interpreted-d${interpreted}-m${mk}-2026`;
      
      await prisma.event.upsert({
        where: { slug },
        update: { 
          dueAt: depositDate,
          shortSummary: `Official Florida DCF deposit date for Case IDs where the 9th and 8th digits are interpreted as ${interpreted} (read backward).`,
          scheduleRules: { interpretedDigit: interpreted, agency: 'Florida DCF (MyACCESS)' } as any
        },
        create: {
          seriesId: series.id,
          title: `Florida SNAP — Digits ${rawExample} read as ${interpreted}`,
          slug, 
          category: 'STATE' as any, 
          dueAt: depositDate,
          shortSummary: `Official Florida DCF deposit date for Case IDs where the 9th and 8th digits are interpreted as ${interpreted} (read backward).`,
          scheduleRules: { interpretedDigit: interpreted, agency: 'Florida DCF (MyACCESS)' } as any
        }
      });
    }
  }

  console.log("✅ Florida Identity Crisis Resolved.");
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });