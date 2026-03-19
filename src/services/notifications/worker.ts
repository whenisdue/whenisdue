import { prisma } from "@/lib/prisma";
import { processSubscriptionEvaluation } from "./orchestrator";

/**
 * THE DAILY SWEEP (WORKER)
 * Finds all active subscribers and feeds them to the Orchestrator.
 */
export async function runDailyNotificationSweep(businessDate: string) {
  console.log(`[Worker] Starting sweep for Business Date: ${businessDate}`);

  // 1. Create a "Compiler Run" ID for this batch
  // This groups all of today's audits together for easy debugging.
  const run = await prisma.compilerRun.create({
    data: {
      compilerVersion: "Phase-11-Deterministic",
      note: `Scheduled sweep for ${businessDate}`,
    },
  });

  // 2. Find all ACTIVE subscriptions
  // We grab the subscriber email and the current RuleSet in one query.
  const subscriptions = await prisma.subscription.findMany({
    where: { 
      status: "ACTIVE",
      // Optional: You can filter by nextDepositDate here if you want to be precise
      nextDepositDate: new Date(businessDate) 
    },
    include: {
      subscriber: true,
    },
  });

  console.log(`[Worker] Found ${subscriptions.length} active subscriptions due.`);

  for (const sub of subscriptions) {
    try {
      // 3. Resolve the "Current RuleSet" for this State/Program
      const ruleSet = await prisma.scheduleRuleSet.findFirst({
        where: {
          identity: {
            stateCode: sub.stateCode,
            programCode: sub.programCode,
          },
          status: "ACTIVE",
          recordedTo: null, // Only grab the current "Truth"
        },
      });

      if (!ruleSet) {
        console.warn(`[Worker] No active RuleSet found for ${sub.stateCode}-${sub.programCode}. Skipping.`);
        continue;
      }

      // 4. Determine the Cycle Key (YYYY-MM)
      // For now, we derive it from the businessDate string.
      const cycleKey = businessDate.substring(0, 7); 

      // 5. HAND OFF TO THE ORCHESTRATOR (The Brain)
      // This is where our Green-Lighted logic lives!
      const result = await processSubscriptionEvaluation({
        subscriptionId: sub.id,
        cycleKey: cycleKey,
        notificationType: "DEPOSIT_REMINDER",
        channel: "EMAIL",
        ruleSetVersionId: ruleSet.id,
        compilerRunId: run.id,
        engineOutcome: 'SEND', // In a full build, this comes from your Logic Engine
        engineReason: 'SCHEDULED_TRIGGER_MET',
        outboxCategory: 'NONE', // In a full build, you'd check existing Outbox rows first
        // ... inside your worker.ts loop
frozenPayload: {
  to: sub.subscriber.email,
  subject: `Your ${sub.programCode} Deposit reminder`,
  html: `Hi! Your ${sub.programCode} deposit for ${sub.stateCode} is expected on ${businessDate}.`, // CHANGED 'body' TO 'html'
},
      });

      console.log(`[Worker] Processed ${sub.subscriber.email}: ${result.action}`);

    } catch (error) {
      console.error(`[Worker] Failed to process subscription ${sub.id}:`, error);
    }
  }

  console.log(`[Worker] Sweep completed for ${businessDate}`);
}