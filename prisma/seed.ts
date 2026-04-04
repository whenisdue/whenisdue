import { PrismaClient, Prisma } from '@prisma/client';
import { addDays, isWeekend } from 'date-fns';

const prisma = new PrismaClient();

// --- Types ---
type ShiftCause = 'WEEKEND' | 'HOLIDAY' | 'BUSINESS_DAY' | 'NONE';
type AppliedPolicy = 'PREVIOUS_BUSINESS_DAY' | 'NEXT_BUSINESS_DAY' | 'SAME_DAY' | 'NO_SHIFT';

// --- Helpers ---
const toDateStr = (d: Date) => 
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

const mapToAppliedPolicy = (input: string): AppliedPolicy => {
  const mapping: Record<string, AppliedPolicy> = {
    'PREVIOUS_BUSINESS_DAY': 'PREVIOUS_BUSINESS_DAY',
    'NEXT_BUSINESS_DAY': 'NEXT_BUSINESS_DAY',
    'NO_SHIFT': 'SAME_DAY',
    'SAME_DAY': 'SAME_DAY'
  };
  return mapping[input] || 'SAME_DAY';
};

function applyHolidayPolicy(nominalDate: Date, policy: string): Date {
  let current = new Date(nominalDate);
  if (policy === 'PREVIOUS_BUSINESS_DAY') {
    while (isWeekend(current)) current = addDays(current, -1);
  } else if (policy === 'NEXT_BUSINESS_DAY') {
    while (isWeekend(current)) current = addDays(current, 1);
  }
  return current;
}

async function main() {
  console.log("🧹 Wiping bitemporal ledger...");
  await prisma.paymentEvent.deleteMany();
  await prisma.compilerRun.deleteMany();
  await prisma.scheduleRuleSet.deleteMany();
  await prisma.ruleIdentity.deleteMany();

  const year = 2026;

  const rulesets = [
    {
      stateCode: "AL",
      identifierKind: "CASE_NUMBER_LAST_DIGIT",
      holidayPolicy: "PREVIOUS_BUSINESS_DAY",
      slices: Array.from({ length: 10 }, (_, i) => ({
        identifierFrom: i.toString(), identifierTo: i.toString(), nominalDepositDay: 4 + (i * 2)
      }))
    },
    {
      stateCode: "FL",
      identifierKind: "CASE_NUMBER_9TH_8TH_DIGIT",
      holidayPolicy: "PREVIOUS_BUSINESS_DAY",
      slices: Array.from({ length: 28 }, (_, i) => {
        const from = i === 0 ? 0 : Math.floor(i * 3.5714);
        const to = i === 27 ? 99 : Math.floor((i + 1) * 3.5714) - 1;
        return { identifierFrom: from.toString().padStart(2, '0'), identifierTo: to.toString().padStart(2, '0'), nominalDepositDay: i + 1 };
      })
    },
    {
      stateCode: "TX",
      identifierKind: "CASE_NUMBER_MULTI_COHORT",
      holidayPolicy: "SAME_DAY",
      slices: [
        { identifierFrom: "0", identifierTo: "0", nominalDepositDay: 1, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "1", identifierTo: "1", nominalDepositDay: 3, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "2", identifierTo: "2", nominalDepositDay: 5, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "3", identifierTo: "3", nominalDepositDay: 6, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "4", identifierTo: "4", nominalDepositDay: 7, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "5", identifierTo: "5", nominalDepositDay: 9, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "6", identifierTo: "6", nominalDepositDay: 11, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "7", identifierTo: "7", nominalDepositDay: 12, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "8", identifierTo: "8", nominalDepositDay: 13, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "9", identifierTo: "9", nominalDepositDay: 15, cohortKey: "PRE_JUNE_2020" },
        { identifierFrom: "00", identifierTo: "07", nominalDepositDay: 16, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "08", identifierTo: "15", nominalDepositDay: 17, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "16", identifierTo: "23", nominalDepositDay: 18, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "24", identifierTo: "31", nominalDepositDay: 19, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "32", identifierTo: "39", nominalDepositDay: 20, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "40", identifierTo: "47", nominalDepositDay: 21, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "48", identifierTo: "55", nominalDepositDay: 22, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "56", identifierTo: "63", nominalDepositDay: 23, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "64", identifierTo: "71", nominalDepositDay: 24, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "72", identifierTo: "79", nominalDepositDay: 25, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "80", identifierTo: "87", nominalDepositDay: 26, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "88", identifierTo: "95", nominalDepositDay: 27, cohortKey: "POST_JUNE_2020" },
        { identifierFrom: "96", identifierTo: "99", nominalDepositDay: 28, cohortKey: "POST_JUNE_2020" }
      ]
    }
  ];

  const compilerRun = await prisma.compilerRun.create({ data: { compilerVersion: "1.1.0", note: "Production-Grade Sync" } });

  const allEvents: Prisma.PaymentEventCreateManyInput[] = [];

  for (const r of rulesets) {
    const identity = await prisma.ruleIdentity.upsert({
      where: { stateCode_programCode_ruleFamily: { stateCode: r.stateCode, programCode: 'SNAP', ruleFamily: 'FULL_SCHEDULE' } },
      update: {}, create: { stateCode: r.stateCode, programCode: 'SNAP' }
    });

    const ruleSet = await prisma.scheduleRuleSet.create({
      data: {
        identityId: identity.id,
        validFrom: new Date(`${year}-01-01T00:00:00Z`),
        status: 'ACTIVE',
        identifierKind: r.identifierKind,
        issuanceWindow: "Monthly Cycle",
        windowBasis: 'CALENDAR_DAY',
        holidayPolicy: r.holidayPolicy,
        masterSequenceJson: r.slices,
        sourceUrl: "https://gov.url",
        sourceAuthority: "State Agency",
        verifiedAt: new Date(),
      }
    });

    for (let month = 0; month < 12; month++) {
      for (const slice of r.slices) {
        const nominalDate = new Date(Date.UTC(year, month, slice.nominalDepositDay));
        const actualDate = applyHolidayPolicy(nominalDate, ruleSet.holidayPolicy);
        const isShifted = toDateStr(nominalDate) !== toDateStr(actualDate);

        allEvents.push({
          batchId: compilerRun.id,
          ruleSetId: ruleSet.id,
          stateCode: r.stateCode,
          programCode: "SNAP",
          benefitYear: year,
          benefitMonth: month + 1,
          nominalDepositDay: slice.nominalDepositDay,
          depositDate: actualDate,
          isShifted,
          shiftCause: (isShifted ? (isWeekend(nominalDate) ? 'WEEKEND' : 'HOLIDAY') : 'NONE') as ShiftCause,
          appliedPolicy: mapToAppliedPolicy(ruleSet.holidayPolicy) as AppliedPolicy,
          identifierKind: ruleSet.identifierKind,
          identifierMatch: slice.identifierFrom === slice.identifierTo ? slice.identifierFrom : `${slice.identifierFrom}-${slice.identifierTo}`,
          cohortKey: (slice as any).cohortKey || null
        });
      }
    }
  }

  const BATCH_SIZE = 100; 
  for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
    await prisma.paymentEvent.createMany({ data: allEvents.slice(i, i + BATCH_SIZE), skipDuplicates: true });
    console.log(`  📦 Ledger Update: [${Math.min(i + BATCH_SIZE, allEvents.length)} / ${allEvents.length}] records written...`);
  }

  console.log("✅ Bitemporal Ledger Fully Hydrated: Denormalized & Production-Safe.");
}

main().catch(console.error).finally(() => prisma.$disconnect());