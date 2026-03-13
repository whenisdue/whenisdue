import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const HOLIDAYS_2026 = [
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-05-25", "2026-06-19",
  "2026-07-03", "2026-09-07", "2026-10-12", "2026-11-11", "2026-11-26", "2026-12-25"
];

function isBusinessDay(date: Date) {
  const day = date.getUTCDay();
  if (day === 0 || day === 6) return false;
  const iso = date.toISOString().split('T')[0];
  return !HOLIDAYS_2026.includes(iso);
}

function adjustDate(date: Date, policy: string): Date {
  let result = new Date(date);
  if (policy === "NO_SHIFT") return result;

  // SHIFT PREVIOUS: Move backward until we hit a business day
  if (policy === "SHIFT_PREVIOUS") {
    while (!isBusinessDay(result)) {
      result.setUTCDate(result.getUTCDate() - 1);
    }
  }

  // SHIFT NEXT: Move forward until we hit a business day
  if (policy === "SHIFT_NEXT") {
    while (!isBusinessDay(result)) {
      result.setUTCDate(result.getUTCDate() + 1);
    }
  }

  return result;
}

async function predict() {
  console.log("Emptying existing PaymentEvents...");
  await prisma.paymentEvent.deleteMany();
  
  const rules = await prisma.scheduleRule.findMany();
  console.log(`Found ${rules.length} states to process.`);

  for (const rule of rules) {
    const { bucketMap } = rule.logicPayload as any;
    const policy = (rule.calendarPolicy as any).weekend || "NO_SHIFT";

    console.log(`Processing ${rule.state}...`);

    for (const bucket of bucketMap) {
      for (let month = 0; month < 12; month++) {
        // Construct the nominal date safely
        let d = new Date(Date.UTC(2026, month, bucket.day));
        
        // Topic 40 Fix: If day 31 doesn't exist in June, it rolls to July 1st. 
        // We force it back to the last day of the intended month.
        if (d.getUTCMonth() !== month) {
          d = new Date(Date.UTC(2026, month + 1, 0));
        }

        const finalDate = adjustDate(d, policy);
        
        // Handle both numeric and alphabetical labels
        const label = typeof bucket.min === 'string' 
          ? `${bucket.min} - ${bucket.max}` 
          : `${String(bucket.min).padStart(2, '0')} - ${String(bucket.max).padStart(2, '0')}`;

        await prisma.paymentEvent.create({
          data: {
            scheduleRuleId: rule.id,
            month: `2026-${String(month + 1).padStart(2, '0')}`,
            depositDate: finalDate,
            identifierMatch: label
          }
        });
      }
    }
  }
  console.log("✅ 2026 Forecast Generated Successfully.");
}

predict()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());