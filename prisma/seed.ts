import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Nuking old rules for clean slate...");
  await prisma.paymentEvent.deleteMany();
  await prisma.scheduleRule.deleteMany();

  const rules = [
    // --- ORIGINAL TRIO ---
    {
      state: "AL", program: "SNAP", ruleType: "DIGIT_RANGE", identifierKind: "case_last_two_digits",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: Array.from({ length: 20 }, (_, i) => ({ min: i * 5, max: (i * 5) + 4, day: i + 4 })),
      source: "https://dhr.alabama.gov/food-assistance/"
    },
    {
      state: "FL", program: "SNAP", ruleType: "DIGIT_RANGE", identifierKind: "case_transformed_two_digit",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [
        { min: 0, max: 3, day: 1 }, { min: 4, max: 6, day: 2 }, { min: 7, max: 10, day: 3 },
        { min: 11, max: 13, day: 4 }, { min: 14, max: 17, day: 5 }, { min: 18, max: 20, day: 6 },
        { min: 21, max: 24, day: 7 }, { min: 25, max: 27, day: 8 }, { min: 28, max: 31, day: 9 },
        { min: 32, max: 34, day: 10 }, { min: 35, max: 38, day: 11 }, { min: 39, max: 41, day: 12 },
        { min: 42, max: 45, day: 13 }, { min: 46, max: 48, day: 14 }, { min: 49, max: 53, day: 15 },
        { min: 54, max: 57, day: 16 }, { min: 58, max: 60, day: 17 }, { min: 61, max: 64, day: 18 },
        { min: 65, max: 67, day: 19 }, { min: 68, max: 71, day: 20 }, { min: 72, max: 74, day: 21 },
        { min: 75, max: 78, day: 22 }, { min: 79, max: 81, day: 23 }, { min: 82, max: 85, day: 24 },
        { min: 86, max: 88, day: 25 }, { min: 89, max: 92, day: 26 }, { min: 93, max: 95, day: 27 },
        { min: 96, max: 99, day: 28 }
      ],
      source: "https://www.myflfamilies.com/services/public-assistance/supplemental-nutrition-assistance-program-snap"
    },
    {
      state: "GA", program: "SNAP", ruleType: "DIGIT_RANGE", identifierKind: "client_id_last_two",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: Array.from({ length: 10 }, (_, i) => ({ min: i * 10, max: (i * 10) + 9, day: (i * 2) + 5 })),
      source: "https://dfcs.georgia.gov/snap-food-stamps"
    },
    // --- BATCH 1 & 2 EXPANSION ---
    {
      state: "CA", program: "SNAP", ruleType: "SINGLE_DIGIT", identifierKind: "case_number_last_digit",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [
        { min: 1, max: 1, day: 1 }, { min: 2, max: 2, day: 2 }, { min: 3, max: 3, day: 3 },
        { min: 4, max: 4, day: 4 }, { min: 5, max: 5, day: 5 }, { min: 6, max: 6, day: 6 },
        { min: 7, max: 7, day: 7 }, { min: 8, max: 8, day: 8 }, { min: 9, max: 9, day: 9 },
        { min: 0, max: 0, day: 10 }
      ],
      source: "https://www.ebtproject.ca.gov/Clients/benefitsavailable.html"
    },
    {
      state: "TX", program: "SNAP", ruleType: "DIGIT_RANGE", identifierKind: "edg_last_two_digits",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [
        { min: 0, max: 3, day: 1 }, { min: 4, max: 6, day: 2 }, { min: 7, max: 10, day: 3 },
        { min: 11, max: 13, day: 4 }, { min: 14, max: 17, day: 5 }, { min: 18, max: 20, day: 6 },
        { min: 21, max: 24, day: 7 }, { min: 25, max: 27, day: 8 }, { min: 28, max: 31, day: 9 },
        { min: 32, max: 34, day: 10 }, { min: 35, max: 38, day: 11 }, { min: 39, max: 41, day: 12 },
        { min: 42, max: 45, day: 13 }, { min: 46, max: 49, day: 14 }, { min: 50, max: 53, day: 15 },
        { min: 54, max: 57, day: 16 }, { min: 58, max: 60, day: 17 }, { min: 61, max: 64, day: 18 },
        { min: 65, max: 67, day: 19 }, { min: 68, max: 71, day: 20 }, { min: 72, max: 74, day: 21 },
        { min: 75, max: 78, day: 22 }, { min: 79, max: 81, day: 23 }, { min: 82, max: 85, day: 24 },
        { min: 86, max: 88, day: 25 }, { min: 89, max: 92, day: 26 }, { min: 93, max: 95, day: 27 },
        { min: 96, max: 99, day: 28 }
      ],
      source: "https://www.hhs.texas.gov/handbooks/texas-works-handbook/b-250-ebt-benefit-issuance"
    },
    {
      state: "NY", program: "SNAP", ruleType: "SINGLE_DIGIT", identifierKind: "case_number_last_digit",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [
        { min: 0, max: 1, day: 1 }, { min: 2, max: 2, day: 2 }, { min: 3, max: 3, day: 3 },
        { min: 4, max: 4, day: 4 }, { min: 5, max: 5, day: 5 }, { min: 6, max: 6, day: 6 },
        { min: 7, max: 7, day: 7 }, { min: 8, max: 8, day: 8 }, { min: 9, max: 9, day: 9 }
      ],
      source: "https://otda.ny.gov/programs/snap/"
    },
    {
      state: "TN", program: "SNAP", ruleType: "DIGIT_RANGE", identifierKind: "ssn_last_two_digits",
      calendarPolicy: { weekend: "SHIFT_PREVIOUS", holiday: "SHIFT_PREVIOUS" },
      buckets: Array.from({ length: 20 }, (_, i) => ({ min: i * 5, max: (i * 5) + 4, day: i + 1 })),
      source: "https://www.tn.gov/content/dam/tn/human-services/documents/SNAP%20Issuance%20Schedule.pdf"
    },
    {
      state: "OH", program: "SNAP", ruleType: "SINGLE_DIGIT", identifierKind: "case_number_last_digit",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: Array.from({ length: 10 }, (_, i) => ({ min: i, max: i, day: (i * 2) + 2 })),
      source: "https://benefits.ohio.gov"
    },
    {
      state: "NC", program: "SNAP", ruleType: "SINGLE_DIGIT", identifierKind: "ssn_last_digit",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [
        { min: 1, max: 1, day: 3 }, { min: 2, max: 2, day: 5 }, { min: 3, max: 3, day: 7 },
        { min: 4, max: 4, day: 9 }, { min: 5, max: 5, day: 11 }, { min: 6, max: 6, day: 13 },
        { min: 7, max: 7, day: 15 }, { min: 8, max: 8, day: 17 }, { min: 9, max: 9, day: 19 },
        { min: 0, max: 0, day: 21 }
      ],
      source: "https://www.ncdhhs.gov/divisions/social-services/food-and-nutrition-services-snap"
    },
    {
      state: "VA", program: "SNAP", ruleType: "DIGIT_RANGE", identifierKind: "case_number_last_digit",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [{ min: 0, max: 3, day: 1 }, { min: 4, max: 5, day: 4 }, { min: 6, max: 9, day: 7 }],
      source: "https://www.dss.virginia.gov/benefit/snap.cgi"
    },
    {
      state: "AZ", program: "SNAP", ruleType: "ALPHABETICAL", identifierKind: "last_name_initial",
      calendarPolicy: { weekend: "SHIFT_NEXT", holiday: "SHIFT_NEXT" },
      buckets: [
        { min: "A", max: "B", day: 1 }, { min: "C", max: "D", day: 2 }, { min: "E", max: "F", day: 3 },
        { min: "G", max: "H", day: 4 }, { min: "I", max: "J", day: 5 }, { min: "K", max: "L", day: 6 },
        { min: "M", max: "N", day: 7 }, { min: "O", max: "P", day: 8 }, { min: "Q", max: "R", day: 9 },
        { min: "S", max: "T", day: 10 }, { min: "U", max: "V", day: 11 }, { min: "W", max: "X", day: 12 },
        { min: "Y", max: "Z", day: 13 }
      ],
      source: "https://des.az.gov/services/basic-needs/food/nutrition-assistance/faqs"
    },
    {
      state: "MI", program: "SNAP", ruleType: "SINGLE_DIGIT", identifierKind: "recipient_id_last_digit",
      calendarPolicy: { weekend: "SHIFT_PREVIOUS", holiday: "SHIFT_PREVIOUS" },
      buckets: Array.from({ length: 10 }, (_, i) => ({ min: i, max: i, day: (i * 2) + 3 })),
      source: "https://www.michigan.gov/mdhhs"
    },
    {
      state: "IN", program: "SNAP", ruleType: "ALPHABETICAL", identifierKind: "last_name_initial",
      calendarPolicy: { weekend: "NO_SHIFT", holiday: "NO_SHIFT" },
      buckets: [
        { min: "A", max: "B", day: 5 }, { min: "C", max: "D", day: 7 }, { min: "E", max: "G", day: 9 },
        { min: "H", max: "I", day: 11 }, { min: "J", max: "L", day: 13 }, { min: "M", max: "N", day: 15 },
        { min: "O", max: "R", day: 17 }, { min: "S", max: "S", day: 19 }, { min: "T", max: "V", day: 21 },
        { min: "W", max: "Z", day: 23 }
      ],
      source: "https://www.in.gov/fssa/dfr/snap-food-assistance/"
    }
  ];

  for (const r of rules) {
    await prisma.scheduleRule.create({
      data: {
        state: r.state,
        program: r.program,
        ruleType: r.ruleType,
        identifierKind: r.identifierKind,
        logicPayload: { bucketMap: r.buckets },
        calendarPolicy: r.calendarPolicy,
        sourceUrl: r.source
      }
    });
  }
  console.log("✅ 13-State Caseworker-Grade Seed Complete.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });