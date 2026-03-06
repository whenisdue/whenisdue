import { PrismaClient, Category, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

const events = [
  // ======================
  // FEDERAL EVENTS
  // ======================

  {
    title: "SSI Payment Schedule 2026",
    slug: "ssi-payment-schedule-2026",
    category: Category.FEDERAL,
    dueAt: new Date("2026-03-01"),
    seriesKey: "ssi-payment",
    status: EventStatus.CONFIRMED,
    trending: true,
    seoTitle: "SSI Payment Schedule 2026 | Exact Deposit Dates",
    seoDescription: "See the exact SSI payment schedule for 2026 including early payments due to weekends and federal holidays.",
    sourceUrl: "https://www.ssa.gov/pubs/EN-05-10031-2025.pdf",
    lastVerified: new Date()
  },

  {
    title: "VA Disability Payment Schedule 2026",
    slug: "va-disability-payment-schedule-2026",
    category: Category.FEDERAL,
    dueAt: new Date("2026-03-01"),
    seriesKey: "va-disability",
    status: EventStatus.CONFIRMED,
    trending: true,
    seoTitle: "VA Disability Payment Schedule 2026",
    seoDescription: "Check the VA disability payment schedule and when deposits arrive.",
    sourceUrl: "https://www.va.gov",
    lastVerified: new Date()
  },

  {
    title: "Social Security Payment Schedule 2026",
    slug: "social-security-payment-schedule-2026",
    category: Category.FEDERAL,
    dueAt: new Date("2026-03-11"),
    seriesKey: "ssa-retirement",
    status: EventStatus.CONFIRMED,
    trending: true,
    seoTitle: "Social Security Payment Dates 2026",
    seoDescription: "Official Social Security payment schedule and direct deposit dates.",
    sourceUrl: "https://www.ssa.gov",
    lastVerified: new Date()
  },

  {
    title: "SSA Retirement Payment Schedule 2026",
    slug: "ssa-retirement-payment-schedule-2026",
    category: Category.FEDERAL,
    dueAt: new Date("2026-03-11"),
    seriesKey: "ssa-retirement",
    status: EventStatus.CONFIRMED,
    trending: false,
    seoTitle: "SSA Retirement Payment Schedule 2026",
    seoDescription: "Monthly Social Security retirement payment dates.",
    sourceUrl: "https://www.ssa.gov",
    lastVerified: new Date()
  },

  // ======================
  // GAMING EVENTS
  // ======================

  {
    title: "Steam Summer Sale 2026",
    slug: "steam-summer-sale-2026",
    category: Category.GAMING,
    dueAt: new Date("2026-06-25T17:00:00Z"),
    seriesKey: "steam-summer-sale",
    status: EventStatus.EXPECTED,
    trending: true,
    seoTitle: "Steam Summer Sale 2026 Countdown",
    seoDescription: "Countdown timer and expected start date for the Steam Summer Sale.",
    sourceUrl: "https://store.steampowered.com",
    lastVerified: new Date()
  },

  {
    title: "Nintendo Direct June 2026",
    slug: "nintendo-direct-june-2026",
    category: Category.GAMING,
    expectedAt: new Date("2026-06-16T15:00:00Z"),
    seriesKey: "nintendo-direct",
    status: EventStatus.EXPECTED,
    trending: true,
    seoTitle: "Nintendo Direct June 2026 Countdown",
    seoDescription: "Expected Nintendo Direct broadcast window and countdown timer.",
    sourceUrl: "https://www.nintendo.com/nintendo-direct",
    lastVerified: new Date()
  },

  {
    title: "Fortnite Chapter 7 Season 1",
    slug: "fortnite-chapter-7-season-1",
    category: Category.GAMING,
    dueAt: new Date("2026-03-08T07:00:00Z"),
    seriesKey: "fortnite-season",
    status: EventStatus.CONFIRMED,
    trending: true,
    seoTitle: "Fortnite Chapter 7 Season 1 Countdown",
    seoDescription: "Countdown until the next Fortnite season launch.",
    sourceUrl: "https://www.epicgames.com",
    lastVerified: new Date()
  },

  {
    title: "Gamescom Opening Night Live 2026",
    slug: "gamescom-opening-night-live-2026",
    category: Category.GAMING,
    expectedAt: new Date("2026-08-25T18:00:00Z"),
    seriesKey: "gamescom-onl",
    status: EventStatus.EXPECTED,
    trending: false,
    seoTitle: "Gamescom Opening Night Live 2026 Countdown",
    seoDescription: "Countdown to the Gamescom Opening Night Live presentation.",
    sourceUrl: "https://www.gamescom.global",
    lastVerified: new Date()
  },

  // ======================
  // SHOPPING EVENTS
  // ======================

  {
    title: "Black Friday 2026",
    slug: "black-friday-2026",
    category: Category.SHOPPING,
    dueAt: new Date("2026-11-27T00:00:00Z"),
    seriesKey: "black-friday",
    status: EventStatus.CONFIRMED,
    trending: true,
    seoTitle: "Black Friday 2026 Countdown",
    seoDescription: "Countdown timer for Black Friday 2026 deals.",
    sourceUrl: "https://www.nrf.com",
    lastVerified: new Date()
  },

  {
    title: "Amazon Prime Day 2026",
    slug: "amazon-prime-day-2026",
    category: Category.SHOPPING,
    expectedAt: new Date("2026-07-15T00:00:00Z"),
    seriesKey: "prime-day",
    status: EventStatus.EXPECTED,
    trending: true,
    seoTitle: "Amazon Prime Day 2026 Countdown",
    seoDescription: "Countdown until Amazon Prime Day deals begin.",
    sourceUrl: "https://www.amazon.com",
    lastVerified: new Date()
  },

  {
    title: "Cyber Monday 2026",
    slug: "cyber-monday-2026",
    category: Category.SHOPPING,
    dueAt: new Date("2026-11-30T00:00:00Z"),
    seriesKey: "cyber-monday",
    status: EventStatus.CONFIRMED,
    trending: false,
    seoTitle: "Cyber Monday 2026 Countdown",
    seoDescription: "Countdown to Cyber Monday online sales.",
    sourceUrl: "https://www.nrf.com",
    lastVerified: new Date()
  },

  // ======================
  // TECH EVENTS
  // ======================

  {
    title: "Apple Event September 2026",
    slug: "apple-event-september-2026",
    category: Category.TECH,
    expectedAt: new Date("2026-09-10T17:00:00Z"),
    seriesKey: "apple-september-event",
    status: EventStatus.EXPECTED,
    trending: true,
    seoTitle: "Apple Event September 2026 Countdown",
    seoDescription: "Countdown to the annual Apple September keynote.",
    sourceUrl: "https://www.apple.com",
    lastVerified: new Date()
  },

  {
    title: "WWDC Keynote 2026",
    slug: "wwdc-2026-keynote",
    category: Category.TECH,
    expectedAt: new Date("2026-06-08T17:00:00Z"),
    seriesKey: "wwdc",
    status: EventStatus.EXPECTED,
    trending: true,
    seoTitle: "WWDC 2026 Keynote Countdown",
    seoDescription: "Countdown until Apple's Worldwide Developers Conference keynote.",
    sourceUrl: "https://developer.apple.com/wwdc",
    lastVerified: new Date()
  }

];

async function main() {
  for (const event of events) {
    await prisma.event.upsert({
      where: { slug: event.slug },
      update: event,
      create: event
    });
  }

  console.log(`Seeded ${events.length} events.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });