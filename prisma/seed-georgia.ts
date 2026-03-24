import { PrismaClient, EventCategory } from '@prisma/client';
// 🛡️ Pathing: Standard relative path from prisma/ to lib/
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: GEORGIA CANONICAL SEED (V5)
 * Strategy: Weekend Sensitive (Preceding Friday Shift)
 * Fix: Signature Match (3 Arguments: Object, Month, Year)
 */

// 🛡️ FIX A: Deterministic local date-key extraction for the audit layer
function toLocalDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function main() {
  const year = 2026;
  const stateSlug = "georgia";

  console.log(`🎬 Starting Georgia 2026 synchronization (DFCS Gateway)...`);

  const state = await prisma.state.upsert({
    where: { slug: stateSlug },
    update: {},
    create: {
      name: "Georgia",
      slug: stateSlug,
      abbreviation: "GA",
      officialUrl: "https://gateway.ga.gov/"
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

  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `${stateSlug}-snap-${year}` },
    update: {},
    create: {
      title: "Georgia SNAP Deposit Schedule 2026",
      slugBase: `${stateSlug}-snap-${year}`,
      category: EventCategory.STATE,
      description: "Official 2026 monthly issuance schedule for Georgia SNAP/Food Stamps via Georgia Gateway.",
    }
  });

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const digits = Array.from({ length: 100 }, (_, i) => i);

  for (const month of months) {
    const monthKey = String(month).padStart(2, '0');
    
    for (const digit of digits) {
      const digitStr = digit.toString().padStart(2, '0');
      const baseDay = 5 + Math.floor(digit / 5);

      // 🛡️ FIX: Signature Match (Aligning with your Object-based engine)
      const depositDate = calculateSmartDate(
        { baseDay: baseDay, offsetStrategy: 'WEEKEND_SENSITIVE' as any },
        month,
        year
      );

      const eventSlug = `${stateSlug}-snap-d${digitStr}-m${monthKey}-${year}`;

      await prisma.event.upsert({
        where: { slug: eventSlug },
        update: {
          seriesId: series.id,
          title: `SNAP Deposit (ID Ending in ${digitStr})`,
          category: EventCategory.STATE,
          dueAt: depositDate,
          shortSummary: `Official Georgia DFCS EBT deposit for case IDs ending in ${digitStr}.`,
          scheduleRules: {
            digit: digitStr,
            baseDay: baseDay,
            programId: snapProgram.id,
            agency: 'DFCS'
          }
        },
        create: {
          seriesId: series.id,
          title: `SNAP Deposit (ID Ending in ${digitStr})`,
          slug: eventSlug,
          category: EventCategory.STATE,
          dueAt: depositDate,
          shortSummary: `Official Georgia DFCS EBT deposit for case IDs ending in ${digitStr}.`,
          scheduleRules: {
            digit: digitStr,
            baseDay: baseDay,
            programId: snapProgram.id,
            agency: 'DFCS'
          }
        },
      });
    }
    console.log(`📍 Georgia Month ${monthKey}/2026 synchronized.`);
  }

  // 🛡️ FIX A: POST-SEED CANARY LOGIC AUDIT (Timezone-Safe)
  console.log("🧪 Running Timezone-Safe Canary Audit...");
  
  const canaries = [
    { digit: "00", month: "04", expected: "2026-04-03" }, // Sunday Shift
    { digit: "20", month: "05", expected: "2026-05-08" }, // Saturday Shift
    { digit: "95", month: "10", expected: "2026-10-23" }  // Saturday Shift (End Window)
  ];

  for (const c of canaries) {
    const slug = `${stateSlug}-snap-d${c.digit}-m${c.month}-${year}`;
    const row = await prisma.event.findUnique({ where: { slug } });
    
    const actual = row?.dueAt ? toLocalDateKey(row.dueAt) : undefined;
    
    if (actual !== c.expected) {
      throw new Error(`🚨 CANARY FAILURE: ${slug} expected ${c.expected} but got ${actual}`);
    }
    console.log(`✅ Verified: ${slug} -> ${actual}`);
  }

  console.log(`✨ Georgia 2026 fully synchronized`);
}

main()
  .catch((e) => {
    console.error(`❌ Seed Failed: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });