import { PrismaClient } from '@prisma/client';
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

  // --- TOPIC 61 RULES DEFINITIONS ---
  const rulesets = [
    {
      stateCode: "AL",
      stateName: "Alabama",
      identifierKind: "CASE_NUMBER_LAST_DIGIT",
      holidayPolicy: "PREVIOUS_BUSINESS_DAY",
      sourceAgency: "Alabama Dept of Human Resources",
      sourceUrl: "https://dhr.alabama.gov/food-assistance/",
      slices: Array.from({ length: 10 }, (_, i) => ({
        identifierFrom: i.toString(),
        identifierTo: i.toString(),
        nominalDepositDay: 4 + (i * 2) // Digits 0-9 map to days 4-22
      }))
    },
    // --- SURGICAL REPLACEMENT: FULL SPECTRUM FLORIDA RULES ---
    {
      stateCode: "FL",
      stateName: "Florida",
      identifierKind: "CASE_NUMBER_9TH_8TH_DIGIT",
      holidayPolicy: "PREVIOUS_BUSINESS_DAY",
      sourceAgency: "Florida Dept of Children and Families",
      sourceUrl: "https://www.myflfamilies.com/snap-issuance-schedule",
      slices: Array.from({ length: 28 }, (_, i) => {
        const day = i + 1;
        
        // This math (3.5714) ensures we spread 100 units (00-99) across 28 days
        // Group 0 starts at 00, Group 27 ends at 99.
        const from = i === 0 ? 0 : Math.floor(i * 3.5714);
        const to = i === 27 ? 99 : Math.floor((i + 1) * 3.5714) - 1;
        
        return {
          identifierFrom: from.toString().padStart(2, '0'),
          identifierTo: to.toString().padStart(2, '0'),
          nominalDepositDay: day
        };
      })
    }
  ];

  const createdRuleData = [];

  console.log("📑 Registering Rule Identities...");
  for (const r of rulesets) {
    const identity = await prisma.ruleIdentity.upsert({
      where: { 
        stateCode_programCode_ruleFamily: { 
          stateCode: r.stateCode, 
          programCode: 'SNAP', 
          ruleFamily: 'FULL_SCHEDULE' 
        } 
      },
      update: {},
      create: { 
        stateCode: r.stateCode, 
        programCode: 'SNAP' 
      }
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
        sourceUrl: r.sourceUrl,
        sourceAuthority: r.sourceAgency,
        verifiedAt: new Date(),
      }
    });

    createdRuleData.push({ ruleSet, stateCode: r.stateCode });
  }

  const compilerRun = await prisma.compilerRun.create({
    data: { 
        compilerVersion: "1.1.0", 
        initiatedBy: "SEED_SYSTEM",
        note: "Initial 2026 Batch - Spectrum Calibration"
    }
  });

  const allEvents = [];

  console.log("⚙️ Compiling 2026 Calendar...");
  for (const { ruleSet, stateCode } of createdRuleData) {
    const sequence = ruleSet.masterSequenceJson as any[];
    for (let month = 0; month < 12; month++) {
      for (const slice of sequence) {
        const nominalDate = new Date(Date.UTC(year, month, slice.nominalDepositDay));
        const actualDate = applyHolidayPolicy(nominalDate, ruleSet.holidayPolicy);
        const isShifted = toDateStr(nominalDate) !== toDateStr(actualDate);

        let shiftCause: ShiftCause = 'NONE';
        if (isShifted) {
          shiftCause = isWeekend(nominalDate) ? 'WEEKEND' : 'HOLIDAY';
        }

        const matchStr = slice.identifierFrom === slice.identifierTo 
            ? slice.identifierFrom 
            : `${slice.identifierFrom}-${slice.identifierTo}`;

        allEvents.push({
          batchId: compilerRun.id,
          ruleSetId: ruleSet.id,
          stateCode: stateCode,
          programCode: "SNAP",
          benefitYear: year,
          benefitMonth: month + 1,
          nominalDepositDay: slice.nominalDepositDay,
          depositDate: actualDate,
          isShifted,
          shiftCause,
          appliedPolicy: mapToAppliedPolicy(ruleSet.holidayPolicy),
          identifierKind: ruleSet.identifierKind,
          identifierMatch: matchStr,
        });
      }
    }
  }

  // --- NEON BATCHER INTEGRATION ---
  console.log(`🚀 Preparing to seed ${allEvents.length} events...`);

  const BATCH_SIZE = 100; 

  for (let i = 0; i < allEvents.length; i += BATCH_SIZE) {
    const batch = allEvents.slice(i, i + BATCH_SIZE);
    
    await prisma.paymentEvent.createMany({
      data: batch,
      skipDuplicates: true,
    });

    const progress = Math.min(i + BATCH_SIZE, allEvents.length);
    console.log(`  📦 Ledger Update: [${progress} / ${allEvents.length}] records written...`);
  }

  console.log("✅ Bitemporal Ledger Fully Hydrated with Full Spectrum Coverage.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });