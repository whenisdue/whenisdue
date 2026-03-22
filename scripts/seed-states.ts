import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", 
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", 
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", 
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", 
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", 
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", 
    "Wisconsin", "Wyoming"
  ];

  for (const state of states) {
    await prisma.event.upsert({
      where: { slug: `${state.toLowerCase()}-2026-schedule` },
      update: {},
      create: {
        title: `${state} 2026 Benefit Issuance`,
        slug: `${state.toLowerCase()}-2026-schedule`,
        category: "STATE",
        dueAt: new Date("2026-04-15T00:00:00Z"),
      },
    });
  }
  console.log("✅ All 50 states seeded successfully!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());