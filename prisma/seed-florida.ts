import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Florida Beachhead Seed...");

  // 1. Ensure Florida State exists
  const florida = await prisma.state.upsert({
    where: { abbreviation: "FL" },
    update: {},
    create: {
      name: "Florida",
      slug: "florida",
      abbreviation: "FL",
      officialUrl: "https://www.myflfamilies.com/services/public-assistance/snap"
    }
  });

  // 2. Ensure SNAP Program exists
  const snap = await prisma.program.upsert({
    where: { id: "fl-snap-program" }, // Using a fixed ID for idempotency
    update: {},
    create: {
      id: "fl-snap-program",
      name: "SNAP (Food Assistance)",
      category: "BENEFIT",
      stateId: florida.id
    }
  });

  // 3. Complete Florida Logic (00-99 Coverage)
  // Logic: 9th and 8th digits determine the base day.
  const flRules = [
    { start: "00", end: "03", day: 1 },  { start: "04", end: "06", day: 2 },
    { start: "07", end: "10", day: 3 },  { start: "11", end: "13", day: 4 },
    { start: "14", end: "17", day: 5 },  { start: "18", end: "20", day: 6 },
    { start: "21", end: "24", day: 7 },  { start: "25", end: "27", day: 8 },
    { start: "28", end: "31", day: 9 },  { start: "32", end: "34", day: 10 },
    { start: "35", end: "38", day: 11 }, { start: "39", end: "41", day: 12 },
    { start: "42", end: "45", day: 13 }, { start: "46", end: "48", day: 14 },
    { start: "49", end: "53", day: 15 }, { start: "54", end: "57", day: 16 },
    { start: "58", end: "60", day: 17 }, { start: "61", end: "64", day: 18 },
    { start: "65", end: "67", day: 19 }, { start: "68", end: "71", day: 20 },
    { start: "72", end: "74", day: 21 }, { start: "75", end: "78", day: 22 },
    { start: "79", end: "81", day: 23 }, { start: "82", end: "85", day: 24 },
    { start: "86", end: "88", day: 25 }, { start: "89", end: "92", day: 26 },
    { start: "93", end: "95", day: 27 }, { start: "96", end: "99", day: 28 }
  ];

  console.log("Cleaning old Florida rules...");
  await prisma.rule.deleteMany({ where: { programId: snap.id } });

  console.log(`Seeding ${flRules.length} deterministic rules...`);
  for (const r of flRules) {
    await prisma.rule.create({
      data: {
        programId: snap.id,
        triggerType: TriggerType.CASE_DIGIT,
        triggerStart: r.start,
        triggerEnd: r.end,
        baseDay: r.day,
        offsetStrategy: DateOffsetStrategy.PREV_BUSINESS_DAY,
        sourceCitation: "Florida DCF Public Assistance Manual Section 1410.0102"
      }
    });
  }

  // 4. High-Contrast Action Resources
  const flResources = [
    { 
      name: "Florida EBT Balance Check", 
      type: "PHONE", 
      value: "1-888-356-3281" 
    },
    { 
      name: "Florida DCF Help Line", 
      type: "PHONE", 
      value: "1-850-300-4323" 
    },
    { 
      name: "Feeding Florida (Food Banks)", 
      type: "LINK", 
      value: "https://www.feedingflorida.org/find-food" 
    },
    { 
      name: "Emergency Assistance", 
      type: "PHONE", 
      value: "211" 
    }
  ];

  console.log("Cleaning old Florida resources...");
  await prisma.resource.deleteMany({ where: { stateId: florida.id } });

  console.log("Seeding accessibility-first resources...");
  for (const res of flResources) {
    await prisma.resource.create({
      data: {
        stateId: florida.id,
        name: res.name,
        type: res.type,
        value: res.value
      }
    });
  }

  console.log("✅ Florida Beachhead Fully Hydrated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

export {};