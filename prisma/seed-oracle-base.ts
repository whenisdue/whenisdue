import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🏛️ INITIALIZING MASTER PROGRAM BRIDGE...");

  const states = [
    { name: 'New York', abbreviation: 'NY', slug: 'new-york' },
    { name: 'California', abbreviation: 'CA', slug: 'california' },
    { name: 'Texas', abbreviation: 'TX', slug: 'texas' },
    { name: 'Florida', abbreviation: 'FL', slug: 'florida' },
    { name: 'Georgia', abbreviation: 'GA', slug: 'georgia' },
    { name: 'Pennsylvania', abbreviation: 'PA', slug: 'pennsylvania' },
  ];

  for (const s of states) {
    // 1. HYDRATE STATE (Legacy & Sovereign requirement)
    const stateRecord = await prisma.state.upsert({
      where: { abbreviation: s.abbreviation },
      update: {},
      create: s,
    });

    // 2. HYDRATE LEGACY PROGRAM (Required for seed-new-york.ts)
    await prisma.program.upsert({
      where: { 
        program_identity: { stateId: stateRecord.id, name: 'SNAP' } 
      },
      update: {},
      create: { 
        stateId: stateRecord.id, 
        name: 'SNAP', 
        category: 'Food' 
      },
    });

    // 3. HYDRATE SOVEREIGN BENEFITPROGRAM (Required for Topic B010)
    await prisma.benefitProgram.upsert({
      where: { 
        stateCode_name: { stateCode: s.abbreviation, name: 'SNAP' } 
      },
      update: {},
      create: { 
        stateCode: s.abbreviation, 
        name: 'SNAP' 
      },
    });

    console.log(`✅ BRIDGE ACTIVE: ${s.abbreviation} (State + Program + BenefitProgram)`);
  }

  console.log("🏁 MASTER BASE HYDRATED.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });