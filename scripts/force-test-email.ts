import { PrismaClient, OutboxStatus, DecisionReason, RuleStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("🛠️  EXECUTING CLEAN SWEEP...");

  const email = 'bjesguerra2025@gmail.com';

  // 1. Ensure Subscriber exists
  await prisma.subscriber.upsert({
    where: { email },
    update: { verifiedEmail: email, emailVerifiedAt: new Date() },
    create: {
      email,
      normalizedEmail: email.toLowerCase(),
      verifiedEmail: email,
      emailVerifiedAt: new Date()
    }
  });
  console.log("✅ Subscriber active.");

  // 2. SELF-HEALING: Ensure Bitemporal records exist
  let ruleSet = await prisma.scheduleRuleSet.findFirst();
  if (!ruleSet) {
    console.log("⚠️ Missing RuleSet. Provisioning temporary rule...");
    const identity = await prisma.ruleIdentity.create({
      data: { stateCode: "VT", programCode: "SNAP" }
    });
    ruleSet = await prisma.scheduleRuleSet.create({
      data: {
        identityId: identity.id,
        validFrom: new Date(),
        status: RuleStatus.ACTIVE,
        identifierKind: "CASE_NUMBER",
        issuanceWindow: "1-10",
        windowBasis: "CALENDAR",
        holidayPolicy: "NEXT_BUSINESS_DAY",
        masterSequenceJson: {},
        sourceAuthority: "Internal Test",
        sourceUrl: "http://localhost"
      }
    });
  }

  let compiler = await prisma.compilerRun.findFirst();
  if (!compiler) {
    console.log("⚠️ Missing CompilerRun. Provisioning temporary run...");
    compiler = await prisma.compilerRun.create({
      data: { compilerVersion: "1.0.0-test", initiatedBy: "force-test-script" }
    });
  }

  // REPAIR: Updated to match Phase 9 schema properties
  const sub = await prisma.subscription.upsert({
    where: { id: "test-sub-id" }, 
    update: {},
    create: {
      id: "test-sub-id",
      subscriberId: (await prisma.subscriber.findUnique({ where: { email } }))!.id,
      stateCode: "VT",
      programName: "SNAP",
      identifierValue: "5",
      nextDepositDate: new Date(),
      status: "ACTIVE"
    },
    include: { subscriber: true }
  });

  // 3. Create fresh Audit entry
  const decision = await prisma.notificationDecisionAudit.create({
    data: {
      subscriptionId: sub.id,
      compilerRunId: compiler.id,
      ruleSetVersionId: ruleSet.id,
      reason: DecisionReason.DATE_SHIFT_DETECTED,
    }
  });

  // 4. Create fresh Outbox entry
  const outbox = await prisma.notificationOutbox.create({
    data: {
      decisionAuditId: decision.id,
      status: OutboxStatus.PENDING,
      processAt: new Date(),
      idempotencyKey: `manual-test-${decision.id}`, 
      frozenPayload: {
        from: process.env.NOTIFICATION_FROM_EMAIL || "onboarding@resend.dev",
        to: sub.subscriber.email, 
        subject: "Test: Ironclad Schedule Update",
        html: "<p>This is a manual test of the verified Ironclad Dispatcher.</p>"
      }
    }
  });

  console.log(`✅ ENGINE ARMED: Outbox ID ${outbox.id}`);
  console.log(`👉 Refresh: http://localhost:3000/api/test-notifications?secret=${process.env.CRON_SECRET}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());