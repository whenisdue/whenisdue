import { PrismaClient, TriggerType, DateOffsetStrategy } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const verifiedData = [
    // --- RESEARCH CORRECTIONS ---
    { title: "Louisiana SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Louisiana SNAP Window End", date: "2026-04-23T10:00:00Z" },
    { title: "Virginia SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Virginia SNAP Final Issuance", date: "2026-04-07T10:00:00Z" },
    { title: "Wisconsin FoodShare Earliest", date: "2026-04-02T10:00:00Z" },
    { title: "Wisconsin FoodShare Late", date: "2026-04-15T10:00:00Z" },

    // --- MULTI-COHORT EXPANSIONS ---
    { title: "Texas SNAP (Pre-2020 Case)", date: "2026-04-01T10:00:00Z" },
    { title: "Texas SNAP (Pre-2020 Case)", date: "2026-04-15T10:00:00Z" },
    { title: "Texas SNAP (Post-2020 Case)", date: "2026-04-16T10:00:00Z" },
    { title: "Texas SNAP (Post-2020 Case)", date: "2026-04-28T10:00:00Z" },
    { title: "New York Upstate Window", date: "2026-04-01T10:00:00Z" },
    { title: "New York Upstate Window", date: "2026-04-09T10:00:00Z" },
    { title: "New York City SNAP (A-Cycle)", date: "2026-04-01T10:00:00Z" },
    { title: "New York City SNAP (A-Cycle)", date: "2026-04-14T10:00:00Z" },
    { title: "Pennsylvania (1st Business Day)", date: "2026-04-01T10:00:00Z" },
    { title: "Pennsylvania (10th Business Day)", date: "2026-04-14T10:00:00Z" },
    { title: "Maine (Birthday Digit Window)", date: "2026-04-10T10:00:00Z" },
    { title: "Maine (Birthday Digit Window)", date: "2026-04-14T10:00:00Z" },

    // --- COMPLETE 50-STATE SYNC (April 2026) ---
    { title: "Alabama SNAP Payment", date: "2026-04-04T10:00:00Z" },
    { title: "Alabama SNAP Payment", date: "2026-04-23T10:00:00Z" },
    { title: "Alaska SNAP Monthly", date: "2026-04-01T10:00:00Z" },
    { title: "Arizona SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Arizona SNAP Window End", date: "2026-04-13T10:00:00Z" },
    { title: "Arkansas SNAP Window Start", date: "2026-04-04T10:00:00Z" },
    { title: "Arkansas SNAP Window End", date: "2026-04-13T10:00:00Z" },
    { title: "California CalFresh Early", date: "2026-04-01T10:00:00Z" },
    { title: "California CalFresh Late", date: "2026-04-10T10:00:00Z" },
    { title: "Colorado SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Colorado SNAP Window End", date: "2026-04-10T10:00:00Z" },
    { title: "Connecticut SNAP Window", date: "2026-04-01T10:00:00Z" },
    { title: "Connecticut SNAP Window", date: "2026-04-03T10:00:00Z" },
    { title: "Delaware SNAP Window", date: "2026-04-02T10:00:00Z" },
    { title: "Delaware SNAP Window", date: "2026-04-23T10:00:00Z" },
    { title: "Florida SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "Florida SNAP Late", date: "2026-04-28T10:00:00Z" },
    { title: "Georgia SNAP Early", date: "2026-04-05T10:00:00Z" },
    { title: "Georgia SNAP Late", date: "2026-04-23T10:00:00Z" },
    { title: "Hawaii SNAP Issuance", date: "2026-04-03T10:00:00Z" },
    { title: "Hawaii SNAP Issuance", date: "2026-04-05T10:00:00Z" },
    { title: "Idaho SNAP Window", date: "2026-04-01T10:00:00Z" },
    { title: "Idaho SNAP Window", date: "2026-04-10T10:00:00Z" },
    { title: "Illinois Link Card Early", date: "2026-04-01T10:00:00Z" },
    { title: "Illinois Link Card Late", date: "2026-04-20T10:00:00Z" },
    { title: "Indiana SNAP Window Start", date: "2026-04-05T10:00:00Z" },
    { title: "Indiana SNAP Window End", date: "2026-04-23T10:00:00Z" },
    { title: "Iowa SNAP Window", date: "2026-04-01T10:00:00Z" },
    { title: "Iowa SNAP Window", date: "2026-04-10T10:00:00Z" },
    { title: "Kansas SNAP Window", date: "2026-04-01T10:00:00Z" },
    { title: "Kansas SNAP Window", date: "2026-04-10T10:00:00Z" },
    { title: "Kentucky SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Kentucky SNAP Window End", date: "2026-04-19T10:00:00Z" },
    { title: "Maryland SNAP Early", date: "2026-04-04T10:00:00Z" },
    { title: "Maryland SNAP Late", date: "2026-04-23T10:00:00Z" },
    { title: "Massachusetts DTA Start", date: "2026-04-01T10:00:00Z" },
    { title: "Massachusetts DTA End", date: "2026-04-14T10:00:00Z" },
    { title: "Michigan Bridge Card Early", date: "2026-04-03T10:00:00Z" },
    { title: "Michigan Bridge Card Late", date: "2026-04-21T10:00:00Z" },
    { title: "Minnesota SNAP Early", date: "2026-04-04T10:00:00Z" },
    { title: "Minnesota SNAP Late", date: "2026-04-13T10:00:00Z" },
    { title: "Mississippi SNAP Early", date: "2026-04-04T10:00:00Z" },
    { title: "Mississippi SNAP Late", date: "2026-04-21T10:00:00Z" },
    { title: "Missouri SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "Missouri SNAP Late", date: "2026-04-22T10:00:00Z" },
    { title: "Montana SNAP Window", date: "2026-04-02T10:00:00Z" },
    { title: "Montana SNAP Window", date: "2026-04-06T10:00:00Z" },
    { title: "Nebraska SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Nebraska SNAP Window End", date: "2026-04-05T10:00:00Z" },
    { title: "Nevada SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Nevada SNAP Window End", date: "2026-04-10T10:00:00Z" },
    { title: "New Hampshire SNAP", date: "2026-04-05T10:00:00Z" },
    { title: "New Jersey SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "New Jersey SNAP Late", date: "2026-04-05T10:00:00Z" },
    { title: "New Mexico SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "New Mexico SNAP Late", date: "2026-04-20T10:00:00Z" },
    { title: "North Carolina SNAP Early", date: "2026-04-03T10:00:00Z" },
    { title: "North Carolina SNAP Late", date: "2026-04-21T10:00:00Z" },
    { title: "North Dakota SNAP", date: "2026-04-01T10:00:00Z" },
    { title: "Ohio Direction Card Early", date: "2026-04-02T10:00:00Z" },
    { title: "Ohio Direction Card Late", date: "2026-04-20T10:00:00Z" },
    { title: "Oklahoma SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Oklahoma SNAP Window End", date: "2026-04-10T10:00:00Z" },
    { title: "Oregon SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Oregon SNAP Window End", date: "2026-04-09T10:00:00Z" },
    { title: "Rhode Island SNAP", date: "2026-04-01T10:00:00Z" },
    { title: "South Carolina SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "South Carolina SNAP Late", date: "2026-04-19T10:00:00Z" },
    { title: "South Dakota SNAP", date: "2026-04-10T10:00:00Z" },
    { title: "Tennessee SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "Tennessee SNAP Late", date: "2026-04-20T10:00:00Z" },
    { title: "Utah SNAP Window", date: "2026-04-05T10:00:00Z" },
    { title: "Utah SNAP Window", date: "2026-04-15T10:00:00Z" },
    { title: "Vermont SNAP Monthly", date: "2026-04-01T10:00:00Z" },
    { title: "Washington SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "Washington SNAP Late", date: "2026-04-20T10:00:00Z" },
    { title: "West Virginia SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "West Virginia SNAP Late", date: "2026-04-09T10:00:00Z" },
    { title: "Wyoming SNAP Window Start", date: "2026-04-01T10:00:00Z" },
    { title: "Wyoming SNAP Window End", date: "2026-04-04T10:00:00Z" }
  ];

  console.log("Emptying database for FULL Research-Backed Seed...");
  await prisma.event.deleteMany({ where: { category: "STATE" } });

  console.log(`Seeding ${verifiedData.length} researcher-verified data points...`);
  
  for (const item of verifiedData) {
    await prisma.event.create({
      data: {
        title: item.title,
        category: "STATE",
        dueAt: new Date(item.date),
        slug: item.title.toLowerCase().replace(/[^a-z0-z0-9]/g, '-') + "-" + Math.floor(Math.random() * 10000)
      }
    });
  }

  console.log("Success! Your database is now truly 50-state ready.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

export {};