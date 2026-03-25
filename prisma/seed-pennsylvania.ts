import { PrismaClient, EventCategory } from '@prisma/client';
// 🛡️ M2C1: Maintained the relative path for your ESM environment
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: PENNSYLVANIA CANONICAL SEED (V3)
 * Strategy: Wipe and Replace for Rules + 120 Monthly Events.
 * Logic: Business Day Stagger (Digit 0 = Day 1, Digit 9 = Day 10).
 */

async function main() {
  const year = 2026;
  const stateSlug = "pennsylvania";

  console.log(`🎬 Starting Pennsylvania 2026 synchronization...`);

  // 1. Ensure the State and Program exist
  const state = await prisma.state.upsert({
    where: { abbreviation: "PA" },
    update: { slug: stateSlug },
    create: {
      name: "Pennsylvania",
      slug: stateSlug,
      abbreviation: "PA",
      officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx"
    },
  });

  const snapProgram = await prisma.program.upsert({
    where: { program_identity: { stateId: state.id, name: "SNAP" } },
    update: { category: "BENEFIT" },
    create: {
      name: "SNAP",
      category: "BENEFIT",
      stateId: state.id
    }
  });

  // 2. 🛡️ DOCTOR STRANGE FIX: Clean Slate for Rules
  // This satisfies the 'isIntegrityOk = flTxRules.length === 10' check in page.tsx
  console.log("🧹 Cleaning old Pennsylvania rules...");
  await prisma.rule.deleteMany({
    where: { programId: snapProgram.id }
  });

  console.log("📏 Seeding 10 Pennsylvania logic rules (0-9)...");
  for (let i = 0; i <= 9; i++) {
    const digitStr = i.toString();
    await prisma.rule.create({
      data: {
        programId: snapProgram.id,
        triggerStart: digitStr,
        triggerEnd: digitStr,
        triggerType: 'CASE_DIGIT',
        baseDay: i + 1, // Business Day 1 through 10
        offsetStrategy: 'BUSINESS_DAY_STAGGER',
        cohortKey: 'STANDARD'
      }
    });
  }

  // 3. Ensure the EventSeries exists
  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `${stateSlug}-snap-${year}` },
    update: {},
    create: {
      title: "Pennsylvania SNAP Schedule 2026",
      slugBase: `${stateSlug}-snap-${year}`,
      category: EventCategory.STATE,
      description: "Official 2026 monthly issuance schedule for Pennsylvania SNAP benefits.",
    }
  });

  // 4. Generate the 120 indexable events (12 Months x 10 Digits)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const digits = Array.from({ length: 10 }, (_, i) => i);

  for (const month of months) {
    const monthKey = String(month).padStart(2, '0');
    
    for (const digit of digits) {
      const depositDate = calculateSmartDate(
        { baseDay: digit + 1, offsetStrategy: 'BUSINESS_DAY_STAGGER' as any },
        month,
        year
      );

      const eventSlug = `${stateSlug}-snap-d${digit}-m${monthKey}-${year}`;

      await prisma.event.upsert({
        where: { slug: eventSlug },
        update: {
          seriesId: series.id,
          title: `SNAP Deposit (Digit ${digit})`,
          category: EventCategory.STATE,
          dueAt: depositDate,
          shortSummary: `Official Pennsylvania EBT deposit for case numbers ending in digit ${digit}.`,
          // 🛡️ Cast as any to avoid InputJsonValue strictness
          scheduleRules: {
            digit: digit.toString(),
            businessDay: digit + 1,
            agency: 'DHS'
          } as any
        },
        create: {
          seriesId: series.id,
          title: `SNAP Deposit (Digit ${digit})`,
          slug: eventSlug,
          category: EventCategory.STATE,
          dueAt: depositDate,
          shortSummary: `Official Pennsylvania EBT deposit for case numbers ending in digit ${digit}.`,
          scheduleRules: {
            digit: digit.toString(),
            businessDay: digit + 1,
            agency: 'DHS'
          } as any
        },
      });
    }
    console.log(`📍 PA Month ${monthKey}/2026 synchronized.`);
  }

  console.log(`✨ Pennsylvania 2026 fully canonical.`);
}

main()
  .catch((e) => {
    console.error(`❌ Seed Failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });