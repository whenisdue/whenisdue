const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allStatesData = [
    // ALABAMA
    { title: "Alabama SNAP Group A", date: "2026-04-04T10:00:00Z" },
    { title: "Alabama SNAP Group B", date: "2026-04-23T10:00:00Z" },
    // CALIFORNIA
    { title: "California CalFresh Early", date: "2026-04-01T10:00:00Z" },
    { title: "California CalFresh Late", date: "2026-04-10T10:00:00Z" },
    // FLORIDA
    { title: "Florida SNAP Early", date: "2026-04-01T10:00:00Z" },
    { title: "Florida SNAP Late", date: "2026-04-28T10:00:00Z" },
    // TEXAS
    { title: "Texas Lone Star Early", date: "2026-04-01T10:00:00Z" },
    { title: "Texas Lone Star Late", date: "2026-04-15T10:00:00Z" },
    // NEW YORK
    { title: "New York SNAP Window", date: "2026-04-05T10:00:00Z" },
    // GEORGIA
    { title: "Georgia SNAP Issuance", date: "2026-04-05T10:00:00Z" },
    { title: "Georgia SNAP Issuance", date: "2026-04-23T10:00:00Z" },
    // ILLINOIS
    { title: "Illinois Link Issuance", date: "2026-04-01T10:00:00Z" },
    { title: "Illinois Link Issuance", date: "2026-04-20T10:00:00Z" },
    // OHIO
    { title: "Ohio Direction Card", date: "2026-04-02T10:00:00Z" },
    { title: "Ohio Direction Card", date: "2026-04-20T10:00:00Z" },
    // PENNSYLVANIA
    { title: "Pennsylvania EBT Windows", date: "2026-04-01T10:00:00Z" },
    { title: "Pennsylvania EBT Windows", date: "2026-04-14T10:00:00Z" },
    // MICHIGAN
    { title: "Michigan Bridge Card", date: "2026-04-03T10:00:00Z" },
    { title: "Michigan Bridge Card", date: "2026-04-21T10:00:00Z" }
  ];

  console.log("Emptying database for fresh 2026 seed...");
  await prisma.event.deleteMany({ where: { category: "STATE" } });

  console.log(`Seeding ${allStatesData.length} verified issuance windows...`);
  
  for (const item of allStatesData) {
    await prisma.event.create({
      data: {
        title: item.title,
        category: "STATE",
        dueAt: new Date(item.date),
        slug: item.title.toLowerCase().replace(/ /g, '-') + "-" + Math.floor(Math.random() * 10000)
      }
    });
  }

  console.log("Success! Your database now has a broad high-authority footprint.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());