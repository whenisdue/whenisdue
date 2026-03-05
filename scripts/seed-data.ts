const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const ssdi = await prisma.series.upsert({
    where: { seriesKey: 'ssa-ssdi-payments' },
    update: {},
    create: {
      seriesKey: 'ssa-ssdi-payments',
      canonicalName: 'Social Security Disability Insurance (SSDI)',
      entityName: 'Social Security Administration',
      frequency: 'MONTHLY',
      occurrenceRule: 'DAY_3',
    },
  });

  // Add a verified date for March
  await prisma.occurrence.upsert({
    where: { 
      seriesId_date: { 
        seriesId: ssdi.id, 
        date: new Date('2026-03-03T00:00:00Z') 
      } 
    },
    update: {},
    create: {
      seriesId: ssdi.id,
      date: new Date('2026-03-03T00:00:00Z'),
      status: 'VERIFIED',
      verificationProof: 'https://www.ssa.gov/pubs/EN-05-10031.pdf'
    }
  });

  console.log("Database Seeded: SSDI is now LIVE in SQLite.");
}

main().catch(e => console.error(e));