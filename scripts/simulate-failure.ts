import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function simulate() {
  console.log("🚀 Starting failure simulation...");

  // 1. Find a valid subscription to "target"
  const sub = await prisma.subscription.findFirst({
    include: { subscriber: true }
  });

  if (!sub) {
    console.error("❌ No subscriptions found. Please run your seed script first.");
    return;
  }

  // 2. Find required system IDs for the audit trail
  const ruleSet = await prisma.scheduleRuleSet.findFirst();
  const compiler = await prisma.compilerRun.findFirst();

  if (!ruleSet || !compiler) {
    console.error("❌ Missing RuleSet or CompilerRun. Database state is too empty to simulate.");
    return;
  }

  console.log(`🎯 Targeting: ${sub.subscriber.email}`);

  // 3. Create the Decision Audit (The "Why")
  const audit = await prisma.notificationDecisionAudit.create({
    data: {
      subscriptionId: sub.id,
      cycleKey: "TEST_SIMULATION_2026",
      notificationType: "RECURRING_DEPOSIT",
      channel: "EMAIL",
      persistenceReason: "TERMINAL_FAILURE_ENCOUNTERED",
      ruleSetVersionId: ruleSet.id,
      compilerRunId: compiler.id,
      metadata: {
        attemptCount: 5,
        finalError: "SMTP_RELAY_DENIED: Account suspended",
        simulated: true
      }
    }
  });

  // 4. Create the Outbox Row (The "What") in DEAD_LETTER status
  await prisma.notificationOutbox.create({
    data: {
      decisionAuditId: audit.id,
      status: 'DEAD_LETTER',
      idempotencyKey: `sim-${Date.now()}`,
      frozenPayload: { email: sub.subscriber.email, amount: 500 },
      lastError: "Simulated Terminal Failure: SMTP Relay Denied",
      retryCount: 5,
    }
  });

  console.log("✅ Simulation complete! Refresh your /admin/notifications page.");
}

simulate()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());