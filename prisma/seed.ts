import { PrismaClient, EventCategory, EventDateStatus } from '@prisma/client';

const prisma = new PrismaClient();

// The 50-State Multiplier Array
const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", 
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", 
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", 
  "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

async function main() {
  console.log("Sweeping old events to prepare for Phase 4...");
  await prisma.event.deleteMany();
  await prisma.eventSeries.deleteMany();

  console.log('Seeding Phase 4: Programmatic SEO Authority Hubs...');

  // 1. Create the Master Series (Now with title, slugBase, and category!)
  const snapSeries = await prisma.eventSeries.create({
    data: {
      title: 'SNAP / EBT State Deposit Schedules',
      slugBase: 'snap-ebt-state-schedules',
      category: EventCategory.STATE,
      sourceName: 'USDA & State Health Departments',
      priorityWeight: 10,
    },
  });

  // 2. Programmatically generate 50 unique State pages (The "Spokes")
  console.log(`Generating ${US_STATES.length} state-specific SNAP schedules...`);
  
  for (const state of US_STATES) {
    await prisma.event.create({
      data: {
        title: `${state} SNAP Deposit Schedule 2026`,
        slug: `snap-deposit-schedule-${state.toLowerCase().replace(/\s+/g, '-')}-2026`,
        category: EventCategory.STATE, 
        dueAt: new Date('2026-04-01T04:00:00Z'),
        timeZone: 'America/New_York',
        dateStatus: EventDateStatus.EXACT,
        isArchived: false,
        seriesId: snapSeries.id,
        whatToExpect: `In ${state}, SNAP benefits are distributed onto EBT cards based on the state's specific alphabetical or case-number rolling schedule. Funds typically post between midnight and 6:00 AM local time on your assigned day.`,
        targetAudience: `Registered households participating in the ${state} SNAP program. Check your local agency portal to confirm your exact case number distribution day.`,
      },
    });
  }

  // 3. Add High-Volume National Hubs (IRS & SSI)
  const ssiSeries = await prisma.eventSeries.create({
    data: { 
      title: 'SSI Payment Calendar',
      slugBase: 'ssi-payment-calendar',
      category: EventCategory.FEDERAL,
      sourceName: 'Social Security Administration', 
      priorityWeight: 9 
    },
  });

  await prisma.event.create({
    data: {
      title: 'SSI Payment Schedule - April 2026',
      slug: 'ssi-payment-schedule-april-2026',
      category: EventCategory.FEDERAL,
      dueAt: new Date('2026-04-01T04:00:00Z'),
      dateStatus: EventDateStatus.EXACT,
      seriesId: ssiSeries.id,
      whatToExpect: 'SSI payments are universally distributed on the 1st of the month. If the 1st falls on a weekend, payments are issued on the preceding business day.',
      targetAudience: 'Supplemental Security Income recipients.',
    },
  });

  console.log('✅ Programmatic SEO database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });