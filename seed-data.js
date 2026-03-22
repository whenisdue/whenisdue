const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const realDates = [
    // ALABAMA
    { title: "Alabama SNAP Payment 1", state: "Alabama", date: "2026-04-04T10:00:00Z" },
    { title: "Alabama SNAP Payment 2", state: "Alabama", date: "2026-04-10T10:00:00Z" },
    { title: "Alabama SNAP Payment 3", state: "Alabama", date: "2026-04-18T10:00:00Z" },
    { title: "Alabama SNAP Payment 4", state: "Alabama", date: "2026-04-23T10:00:00Z" },
    
    // CALIFORNIA
    { title: "California CalFresh 1", state: "California", date: "2026-04-01T10:00:00Z" },
    { title: "California CalFresh 2", state: "California", date: "2026-04-04T10:00:00Z" },
    { title: "California CalFresh 3", state: "California", date: "2026-04-10T10:00:00Z" },
    
    // FLORIDA
    { title: "Florida SNAP 1", state: "Florida", date: "2026-04-01T10:00:00Z" },
    { title: "Florida SNAP 2", state: "Florida", date: "2026-04-12T10:00:00Z" },
    { title: "Florida SNAP 3", state: "Florida", date: "2026-04-28T10:00:00Z" },
  ];

  console.log("Cleaning old placeholder data...");
  await prisma.event.deleteMany({ where: { category: "STATE" } });

  console.log("Seeding real 2026 dates...");
  for (const item of realDates) {
    await prisma.event.create({
      data: {
        title: item.title,
        category: "STATE",
        dueAt: new Date(item.date),
        // 🚀 This was the missing piece:
        slug: item.title.toLowerCase().replace(/ /g, '-') + "-" + Math.floor(Math.random() * 10000)
      }
    });
  }
  console.log("Success! Your database is now 'AdSense-Ready'.");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());