import { PrismaClient, EventCategory, EventDateStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Sweeping old events (preserving Audience data)...");
  // We only delete Events and Series, we leave Users and Campaigns alone!
  await prisma.event.deleteMany();
  await prisma.eventSeries.deleteMany();

  console.log("Seeding hardened events...");

  // We are using a mix of hardcoded 2026 dates and dynamic offsets
  // so your "Happening Soon" and "This Week" UI sections populate perfectly.
  const now = Date.now();

  const events = [
    // ======================
    // FEDERAL EVENTS
    // ======================
    {
      title: "SSI Payment Schedule 2026",
      slug: "ssi-payment-schedule-2026",
      category: EventCategory.FEDERAL,
      dueAt: new Date(now + 4 * 24 * 60 * 60 * 1000), // 4 days from now
      timeZone: "America/New_York",
      dateStatus: EventDateStatus.EXACT,
      trending: true,
      seoTitle: "SSI Payment Schedule 2026 | Exact Deposit Dates",
      seoDescription: "See the exact SSI payment schedule for 2026 including early payments due to weekends and federal holidays.",
      sourceUrl: "https://www.ssa.gov/pubs/EN-05-10031-2025.pdf",
      lastVerified: new Date(),
    },
    {
      title: "VA Disability Payment Schedule 2026",
      slug: "va-disability-payment-schedule-2026",
      category: EventCategory.FEDERAL,
      dueAt: new Date(now + 12 * 60 * 60 * 1000), // ~12 hours from now (Will trigger TODAY/LIVE logic)
      timeZone: "America/New_York",
      dateStatus: EventDateStatus.EXACT,
      trending: true,
      seoTitle: "VA Disability Payment Schedule 2026",
      seoDescription: "Check the VA disability payment schedule and when deposits arrive.",
      sourceUrl: "https://www.va.gov",
      lastVerified: new Date(),
    },
    {
      title: "Social Security Payment Schedule 2026",
      slug: "social-security-payment-schedule-2026",
      category: EventCategory.FEDERAL,
      dueAt: new Date("2026-03-11T14:00:00Z"),
      timeZone: "America/New_York",
      dateStatus: EventDateStatus.EXACT,
      trending: true,
      seoTitle: "Social Security Payment Dates 2026",
      seoDescription: "Official Social Security payment schedule and direct deposit dates.",
      sourceUrl: "https://www.ssa.gov",
      lastVerified: new Date(),
    },
    {
      title: "SSA Retirement Payment Schedule 2026",
      slug: "ssa-retirement-payment-schedule-2026",
      category: EventCategory.FEDERAL,
      dueAt: new Date("2026-04-11T14:00:00Z"),
      timeZone: "America/New_York",
      dateStatus: EventDateStatus.EXACT,
      trending: false,
      seoTitle: "SSA Retirement Payment Schedule 2026",
      seoDescription: "Monthly Social Security retirement payment dates.",
      sourceUrl: "https://www.ssa.gov",
      lastVerified: new Date(),
    },

    // ======================
    // GAMING EVENTS
    // ======================
    {
      title: "Steam Summer Sale 2026",
      slug: "steam-summer-sale-2026",
      category: EventCategory.GAMING,
      dueAt: null, // Notice the TBA logic!
      timeZone: null,
      dateStatus: EventDateStatus.TBD_MONTH,
      displayMonth: 6,
      displayYear: 2026,
      dateLabel: "Expected June 2026",
      trending: true,
      seoTitle: "Steam Summer Sale 2026 Countdown",
      seoDescription: "Countdown timer and expected start date for the Steam Summer Sale.",
      sourceUrl: "https://store.steampowered.com",
      lastVerified: new Date(),
    },
    {
      title: "Nintendo Direct June 2026",
      slug: "nintendo-direct-june-2026",
      category: EventCategory.GAMING,
      dueAt: null, 
      timeZone: null,
      dateStatus: EventDateStatus.TBD_MONTH,
      displayMonth: 6,
      displayYear: 2026,
      dateLabel: "June 2026",
      trending: true,
      seoTitle: "Nintendo Direct June 2026 Countdown",
      seoDescription: "Expected Nintendo Direct broadcast window and countdown timer.",
      sourceUrl: "https://www.nintendo.com/nintendo-direct",
      lastVerified: new Date(),
    },
    {
      title: "Fortnite Chapter 7 Season 1",
      slug: "fortnite-chapter-7-season-1",
      category: EventCategory.GAMING,
      dueAt: new Date(now + 1 * 24 * 60 * 60 * 1000), // 1 day from now
      timeZone: "UTC",
      dateStatus: EventDateStatus.EXACT,
      trending: true,
      seoTitle: "Fortnite Chapter 7 Season 1 Countdown",
      seoDescription: "Countdown until the next Fortnite season launch.",
      sourceUrl: "https://www.epicgames.com",
      lastVerified: new Date(),
    },
    {
      title: "Gamescom Opening Night Live 2026",
      slug: "gamescom-opening-night-live-2026",
      category: EventCategory.GAMING,
      dueAt: new Date("2026-08-25T18:00:00Z"),
      timeZone: "Europe/Berlin",
      dateStatus: EventDateStatus.EXACT,
      trending: false,
      seoTitle: "Gamescom Opening Night Live 2026 Countdown",
      seoDescription: "Countdown to the Gamescom Opening Night Live presentation.",
      sourceUrl: "https://www.gamescom.global",
      lastVerified: new Date(),
    },

    // ======================
    // SHOPPING EVENTS
    // ======================
    {
      title: "Black Friday 2026",
      slug: "black-friday-2026",
      category: EventCategory.SHOPPING,
      dueAt: new Date("2026-11-27T05:00:00Z"),
      timeZone: "America/New_York",
      dateStatus: EventDateStatus.EXACT,
      trending: true,
      seoTitle: "Black Friday 2026 Countdown",
      seoDescription: "Countdown timer for Black Friday 2026 deals.",
      sourceUrl: "https://www.nrf.com",
      lastVerified: new Date(),
    },
    {
      title: "Amazon Prime Day 2026",
      slug: "amazon-prime-day-2026",
      category: EventCategory.SHOPPING,
      dueAt: null,
      timeZone: null,
      dateStatus: EventDateStatus.TBD_MONTH,
      displayMonth: 7,
      displayYear: 2026,
      dateLabel: "July 2026",
      trending: true,
      seoTitle: "Amazon Prime Day 2026 Countdown",
      seoDescription: "Countdown until Amazon Prime Day deals begin.",
      sourceUrl: "https://www.amazon.com",
      lastVerified: new Date(),
    },
    {
      title: "Cyber Monday 2026",
      slug: "cyber-monday-2026",
      category: EventCategory.SHOPPING,
      dueAt: new Date("2026-11-30T05:00:00Z"),
      timeZone: "America/New_York",
      dateStatus: EventDateStatus.EXACT,
      trending: false,
      seoTitle: "Cyber Monday 2026 Countdown",
      seoDescription: "Countdown to Cyber Monday online sales.",
      sourceUrl: "https://www.nrf.com",
      lastVerified: new Date(),
    },

    // ======================
    // TECH EVENTS
    // ======================
    {
      title: "Apple Event September 2026",
      slug: "apple-event-september-2026",
      category: EventCategory.TECH,
      dueAt: null,
      timeZone: null,
      dateStatus: EventDateStatus.TBD_MONTH,
      displayMonth: 9,
      displayYear: 2026,
      dateLabel: "September 2026",
      trending: true,
      seoTitle: "Apple Event September 2026 Countdown",
      seoDescription: "Countdown to the annual Apple September keynote.",
      sourceUrl: "https://www.apple.com",
      lastVerified: new Date(),
    },
    {
      title: "WWDC Keynote 2026",
      slug: "wwdc-2026-keynote",
      category: EventCategory.TECH,
      dueAt: new Date("2026-06-08T17:00:00Z"),
      timeZone: "America/Los_Angeles",
      dateStatus: EventDateStatus.EXACT,
      trending: true,
      seoTitle: "WWDC 2026 Keynote Countdown",
      seoDescription: "Countdown until Apple's Worldwide Developers Conference keynote.",
      sourceUrl: "https://developer.apple.com/wwdc",
      lastVerified: new Date(),
    },
  ];

  await prisma.event.createMany({
    data: events,
  });

  console.log(`Database seeded successfully with ${events.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });