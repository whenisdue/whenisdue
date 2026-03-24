import { 
  PrismaClient, 
  EventCategory 
} from '@prisma/client';
// 🛡️ FIX: Added .js extension for ESM compatibility (Standard Node/TS-Node behavior)
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: PENNSYLVANIA CANONICAL SEED
 * Strategy: Indirect Relation (Event -> EventSeries)
 * Logic: 10-Business Day Stagger (Digit 0 = Day 1, Digit 9 = Day 10)
 * Status: Green Light Integration
 */

async function main() {
  const year = 2026;
  const stateSlug = "pennsylvania";

  console.log(`🎬 Starting Pennsylvania 2026 synchronization...`);

  // 1. Ensure the State exists (Clarity Engine)
  const state = await prisma.state.upsert({
    where: { abbreviation: "PA" },
    update: {},
    create: {
      name: "Pennsylvania",
      slug: stateSlug,
      abbreviation: "PA",
      officialUrl: "https://www.dhs.pa.gov/Services/Assistance/Pages/SNAP.aspx"
    },
  });

  // 2. Ensure the SNAP Program exists (Internal Logic Mapping)
  await prisma.program.upsert({
    where: { program_identity: { stateId: state.id, name: "SNAP" } },
    update: {},
    create: {
      name: "SNAP",
      category: "BENEFIT",
      stateId: state.id
    }
  });

  // 3. Ensure the EventSeries exists (The Public Calendar Parent)
  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `${stateSlug}-snap-${year}` },
    update: {},
    create: {
      title: "Pennsylvania SNAP Schedule 2026",
      slugBase: `${stateSlug}-snap-${year}`,
      category: EventCategory.STATE,
      description: "Official 2026 deposit dates for Pennsylvania SNAP benefits.",
    }
  });

  // 4. Generate the 120 Deterministic Calendar Events
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const digits = Array.from({ length: 10 }, (_, i) => i);

  for (const month of months) {
    const monthKey = String(month).padStart(2, '0');
    
    for (const digit of digits) {
      const targetBusinessDay = digit + 1;

      // 🛡️ Engine Match: Calling your verified calculateSmartDate signature
      const depositDate = calculateSmartDate(
        { baseDay: targetBusinessDay, offsetStrategy: 'BUSINESS_DAY_STAGGER' as any },
        month,
        year
      );

      const eventSlug = `${stateSlug}-snap-d${digit}-m${monthKey}-${year}`;

      await prisma.event.upsert({
        where: { slug: eventSlug },
        update: {
          title: `SNAP Deposit (Digit ${digit})`,
          category: EventCategory.STATE,
          dueAt: depositDate,
          series: { connect: { id: series.id } },
          // 🛡️ Schema Match: 'shortSummary' and 'scheduleRules'
          shortSummary: `Official EBT deposit for PA case numbers ending in digit ${digit}.`,
          scheduleRules: {
            digit: digit.toString(),
            businessDay: targetBusinessDay,
            program: 'pa-snap'
          }
        },
        create: {
          title: `SNAP Deposit (Digit ${digit})`,
          slug: eventSlug,
          category: EventCategory.STATE,
          dueAt: depositDate,
          series: { connect: { id: series.id } },
          shortSummary: `Official EBT deposit for PA case numbers ending in digit ${digit}.`,
          scheduleRules: {
            digit: digit.toString(),
            businessDay: targetBusinessDay,
            program: 'pa-snap'
          }
        },
      });
    }
    console.log(`📍 ${monthKey}/2026 Synchronized.`);
  }

  console.log(`✨ Pennsylvania 2026 is now fully canonical and live.`);
}

main()
  .catch((e) => {
    console.error(`❌ Seed Failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });