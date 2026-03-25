import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: FLORIDA CANONICAL SEED (V11)
 * Strategy: 100-Digit "Interpreted" Model
 * Goal: 1,200 Indexable URLs (100 Digits x 12 Months)
 */

const getFloridaDay = (digit: number) => {
  if (digit <= 3) return 1; if (digit <= 6) return 2; if (digit <= 10) return 3;
  if (digit <= 13) return 4; if (digit <= 17) return 5; if (digit <= 20) return 6;
  if (digit <= 24) return 7; if (digit <= 27) return 8; if (digit <= 31) return 9;
  if (digit <= 34) return 10; if (digit <= 38) return 11; if (digit <= 41) return 12;
  if (digit <= 45) return 13; if (digit <= 48) return 14; if (digit <= 53) return 15;
  if (digit <= 57) return 16; if (digit <= 60) return 17; if (digit <= 64) return 18;
  if (digit <= 67) return 19; if (digit <= 71) return 20; if (digit <= 74) return 21;
  if (digit <= 78) return 22; if (digit <= 81) return 23; if (digit <= 85) return 24;
  if (digit <= 88) return 25; if (digit <= 92) return 26; if (digit <= 95) return 27;
  return 28;
};

async function main() {
  console.log("🚀 Starting Florida Canonical Overhaul...");

  const florida = await prisma.state.upsert({
    where: { abbreviation: "FL" },
    update: { slug: "florida" },
    create: {
      name: "Florida",
      slug: "florida",
      abbreviation: "FL",
      officialUrl: "https://www.myflfamilies.com/services/public-assistance/snap"
    }
  });

  const snap = await prisma.program.upsert({
    where: { program_identity: { stateId: florida.id, name: "SNAP" } },
    update: { category: "BENEFIT" },
    create: {
      name: "SNAP",
      category: "BENEFIT",
      stateId: florida.id
    }
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
        offsetStrategy: DateOffsetStrategy.PREVIOUS_BUSINESS_DAY,
        cohortKey: 'STANDARD'
      }
    });
  }

  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `florida-snap-2026` },
    update: {},
    create: {
      title: "Florida SNAP Schedule 2026",
      slugBase: `florida-snap-2026`,
      category: 'STATE',
    }
  });

  console.log("📅 Generating 1,200 indexable events...");
  for (const m of Array.from({ length: 12 }, (_, i) => i + 1)) {
    const mk = m.toString().padStart(2, '0');
    for (let i = 0; i <= 99; i++) {
      const interpreted = i.toString().padStart(2, '0');
      const rawExample = interpreted.split('').reverse().join('');
      
      const depositDate = calculateSmartDate(
        { baseDay: getFloridaDay(i), offsetStrategy: 'PREVIOUS_BUSINESS_DAY' as any },
        m,
        2026
      );

      const slug = `florida-snap-interpreted-d${interpreted}-m${mk}-2026`;
      
      await prisma.event.upsert({
        where: { slug },
        update: { dueAt: depositDate },
        create: {
          seriesId: series.id,
          title: `Florida SNAP — Digits ${rawExample} read as ${interpreted}`,
          slug, 
          category: 'STATE', 
          dueAt: depositDate,
          shortSummary: `Official Florida DCF deposit date for Case IDs where the 9th and 8th digits are interpreted as ${interpreted} (read backward).`,
          scheduleRules: { 
            interpretedDigit: interpreted, 
            agency: 'Florida DCF (MyACCESS)' 
          } as any
        }
      });
    }
    console.log(`📍 Month ${mk}/2026 Synchronized.`);
  }

  console.log("✅ Florida Canonical Overhaul Complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });