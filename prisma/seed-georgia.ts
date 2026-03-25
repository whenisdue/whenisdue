import { PrismaClient, EventCategory } from '@prisma/client';
import { calculateSmartDate } from '../lib/smart-dates.js';

const prisma = new PrismaClient();

/**
 * 🚀 DOCTOR STRANGE PROTOCOL: GEORGIA CANONICAL SEED (V10)
 * Strategy: Wipe and Replace for Rules logic + JSON Type Safety.
 */

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

  console.log("🧹 Cleaning old Georgia rules...");
  await prisma.rule.deleteMany({
    where: { programId: snapProgram.id }
  });

  console.log("📏 Seeding 100 Georgia logic rules (00-99)...");
  for (let i = 0; i <= 99; i++) {
    const digitStr = i.toString().padStart(2, '0');
    const baseDay = 5 + Math.floor(i / 5);

    await prisma.rule.create({
      data: {
        programId: snapProgram.id,
        triggerStart: digitStr,
        triggerEnd: digitStr,
        triggerType: 'NUMERIC_RANGE',
        baseDay: baseDay,
        offsetStrategy: 'WEEKEND_SENSITIVE',
        cohortKey: 'GEORGIA_STANDARD'
      }
    });
  }

  const series = await prisma.eventSeries.upsert({
    where: { slugBase: `${stateSlug}-snap-${year}` },
    update: {},
    create: {
      title: "Georgia SNAP Deposit Schedule 2026",
      slugBase: `${stateSlug}-snap-${year}`,
      category: EventCategory.STATE,
      description: "Official 2026 monthly issuance schedule for Georgia SNAP via Georgia Gateway.",
    }
  });

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const digits = Array.from({ length: 100 }, (_, i) => i);

  for (const month of months) {
    const monthKey = String(month).padStart(2, '0');
    
    for (const digit of digits) {
      const digitStr = digit.toString().padStart(2, '0');
      const baseDay = 5 + Math.floor(digit / 5);

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
          // 🛡️ DOCTOR STRANGE FIX: Cast as any to satisfy Prisma's strict JSON type requirement
          scheduleRules: {
            digit: digitStr,
            baseDay: baseDay,
            programId: snapProgram.id,
            agency: 'DFCS'
          } as any 
        },
        create: {
          seriesId: series.id,
          title: `SNAP Deposit (ID Ending in ${digitStr})`,
          slug: eventSlug,
          category: EventCategory.STATE,
          dueAt: depositDate,
          shortSummary: `Official Georgia DFCS EBT deposit for case IDs ending in ${digitStr}.`,
          // 🛡️ DOCTOR STRANGE FIX: Cast as any to satisfy Prisma's strict JSON type requirement
          scheduleRules: {
            digit: digitStr,
            baseDay: baseDay,
            programId: snapProgram.id,
            agency: 'DFCS'
          } as any 
        },
      });
    }
    console.log(`📍 Georgia Month ${monthKey}/2026 synchronized.`);
  }

  console.log("🧪 Running Timezone-Safe Canary Audit...");
  const canaries = [
    { digit: "00", month: "04", expected: "2026-04-03" },
    { digit: "20", month: "05", expected: "2026-05-08" },
    { digit: "95", month: "10", expected: "2026-10-23" }
  ];

  for (const c of canaries) {
    const slug = `${stateSlug}-snap-d${c.digit}-m${c.month}-${year}`;
    const row = await prisma.event.findUnique({ where: { slug } });
    const actual = row?.dueAt ? toLocalDateKey(row.dueAt) : undefined;
    if (actual !== c.expected) throw new Error(`🚨 CANARY FAILURE: ${slug} expected ${c.expected} but got ${actual}`);
    console.log(`✅ Verified: ${slug} -> ${actual}`);
  }

  console.log(`✨ Georgia 2026 fully synchronized`);
}

main().catch((e) => { console.error(`❌ Seed Failed: ${e.message}`); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });