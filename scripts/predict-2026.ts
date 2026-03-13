// RESEARCH APPLIED: Topic 42 (Safeguards against timezone/date rollover mistakes)
// RESEARCH APPLIED: Topic 30 (February Leap-Year handling clamped to actual month)

import { PrismaClient } from '@prisma/client';

// Instantiate a clean, raw connection
const prisma = new PrismaClient();

async function predictAll() {
  console.log("Wiping old predictions (Bypassing row locks)...");
  
  // Use raw SQL TRUNCATE to instantly wipe the table and clear out any dangling Prisma locks
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "PaymentEvent" CASCADE;`);

  const rules = await prisma.scheduleRule.findMany();

  for (const rule of rules) {
    const payload = rule.logicPayload as any;

    // Safety check: skip if the state doesn't have a bucket map yet
    if (!payload || !payload.bucketMap) {
      console.log(`Skipping ${rule.state}: No bucket map found.`);
      continue;
    }

    console.log(`Generating UTC-Safe Caseworker dates for ${rule.state}...`);

    // Loop through every single case-ending sequence (00-99 coverage)
    for (const bucket of payload.bucketMap) {
      for (let month = 0; month < 12; month++) {
        
        // 1. Compute the nominal date explicitly in UTC Noon to prevent timezone drift
        const predictedDate = new Date(Date.UTC(2026, month, bucket.depositDay, 12, 0, 0));

        // 2. The February Leap-Year Safeguard (Topic 30) - Must use UTC methods!
        // If JS rolled February 30th into March 2nd, we clamp it back to the last day of Feb.
        if (predictedDate.getUTCMonth() !== month) {
          predictedDate.setUTCDate(0); 
        }

        // Format the strings for DB insertion
        const monthString = `2026-${String(month + 1).padStart(2, '0')}`;
        const fromStr = String(bucket.lookupMin).padStart(2, '0');
        const toStr = String(bucket.lookupMax).padStart(2, '0');

        // 3. Create the exact event
        await prisma.paymentEvent.create({
          data: {
            scheduleRuleId: rule.id,
            month: monthString,
            depositDate: predictedDate,
            identifierMatch: `${fromStr}-${toStr}` 
          }
        });
      }
    }
  }
  console.log("✅ 2026 Prediction Engine Complete (Strict UTC Rollover Destroyed).");
}

predictAll()
  .catch((e) => {
    console.error("Engine failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Force the connection to close so the script actually exits in the terminal
    await prisma.$disconnect();
  });