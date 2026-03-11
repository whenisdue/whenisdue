import { PrismaClient, EventCategory, EventDateStatus } from '@prisma/client';

const prisma = new PrismaClient();

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", 
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", 
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", 
  "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", 
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", 
  "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", 
  "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

// Universal anxiety-driven FAQs for SNAP
const standardFaq = [
  {
    question: "Why didn't my SNAP deposit arrive at midnight?",
    answer: "Your SNAP benefits may still arrive later in the day. While the state sends payments early, banks process them in batches. Funds typically appear between 12:01 AM and 6:00 AM, but some banks post them in the afternoon."
  },
  {
    question: "What should I do if my payment is missing?",
    answer: "First, verify your exact deposit date using the table above. If your date has passed and you have waited 24 hours, contact your state's EBT customer service number or local benefit office."
  },
  {
    question: "Do weekends or holidays delay SNAP payments?",
    answer: "It depends on the state. Some states issue benefits early if the date falls on a weekend, while others wait until the next business day. Always check your state's specific holiday policy."
  }
];

async function main() {
  console.log("Sweeping old events to prepare for Phase 4 (Deep Data)...");
  await prisma.event.deleteMany();
  await prisma.eventSeries.deleteMany();

  console.log('Seeding Phase 4: Enriched State Data...');

  const snapSeries = await prisma.eventSeries.create({
    data: {
      title: 'SNAP / EBT State Deposit Schedules',
      slugBase: 'snap-ebt-state-schedules',
      category: EventCategory.STATE,
      sourceName: 'USDA & State Health Departments',
      priorityWeight: 10,
    },
  });

  console.log(`Generating ${US_STATES.length} state-specific SNAP schedules with JSON payloads...`);
  
  for (const state of US_STATES) {
    let scheduleRules = null;
    let whatToExpect = `In ${state}, SNAP benefits are distributed onto EBT cards based on the state's specific rolling schedule.`;

    // INJECTING SPECIFIC JSON RULES FOR TEXAS
    if (state === "Texas") {
      whatToExpect = "Texas distributes SNAP benefits between the 1st and 15th of the month. Your exact date is determined by the last two digits of your Eligibility Determination Group (EDG) number.";
      scheduleRules = {
        headers: ["Last 2 Digits of EDG", "Deposit Date"],
        rows: [
          { identifier: "00–03", date: "April 1, 2026" },
          { identifier: "04–06", date: "April 2, 2026" },
          { identifier: "07–10", date: "April 3, 2026" },
          { identifier: "11–13", date: "April 4, 2026" },
          { identifier: "14–17", date: "April 5, 2026" },
          { identifier: "18–20", date: "April 6, 2026" },
          { identifier: "21–24", date: "April 7, 2026" },
          { identifier: "25–27", date: "April 8, 2026" },
          { identifier: "28–31", date: "April 9, 2026" },
          { identifier: "32–34", date: "April 10, 2026" },
        ],
        footerNote: "If your EDG is higher than 34, payments continue sequentially until the 15th."
      };
    }

    // INJECTING SPECIFIC JSON RULES FOR CALIFORNIA
    if (state === "California") {
      whatToExpect = "California (CalFresh) distributes benefits over the first 10 days of the month. Your deposit day is determined by the last digit of your county case number.";
      scheduleRules = {
        headers: ["Last Digit of Case Number", "Deposit Date"],
        rows: [
          { identifier: "1", date: "April 1, 2026" },
          { identifier: "2", date: "April 2, 2026" },
          { identifier: "3", date: "April 3, 2026" },
          { identifier: "4", date: "April 4, 2026" },
          { identifier: "5", date: "April 5, 2026" },
          { identifier: "6", date: "April 6, 2026" },
          { identifier: "7", date: "April 7, 2026" },
          { identifier: "8", date: "April 8, 2026" },
          { identifier: "9", date: "April 9, 2026" },
          { identifier: "0", date: "April 10, 2026" },
        ]
      };
    }

    // Generic rule for remaining 48 states to keep the seed fast
    if (!scheduleRules) {
      scheduleRules = {
        headers: ["Group / Identifier", "Deposit Date"],
        rows: [
          { identifier: "Group 1", date: "April 1, 2026" },
          { identifier: "Group 2", date: "April 5, 2026" },
          { identifier: "Group 3", date: "April 10, 2026" },
        ]
      };
    }

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
        whatToExpect: whatToExpect,
        targetAudience: `Registered households participating in the ${state} SNAP program.`,
        // ---> THE NEW JSON FIELDS <---
        scheduleRules: scheduleRules,
        faqData: standardFaq, 
      },
    });
  }

  // Add High-Volume National Hubs (SSI)
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
      whatToExpect: 'SSI payments are universally distributed on the 1st of the month.',
      targetAudience: 'Supplemental Security Income recipients.',
      faqData: [
        {
          question: "What happens if the 1st falls on a weekend?",
          answer: "If the 1st of the month is a Saturday, Sunday, or federal holiday, your SSI payment will be issued on the business day immediately preceding the 1st."
        }
      ]
    },
  });

  console.log('✅ Deep Data SEO database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });