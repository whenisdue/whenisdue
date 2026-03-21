// web/src/services/notifications/admin-actions.ts
import { prisma } from "@/lib/prisma"; // FIXED: Added curly braces for named export
import { RecoveryOutcome } from "./types";

export async function triggerManualRecovery(ctx: {
  outboxId: string;
  adminId: string | undefined;
  reason: string;
}): Promise<RecoveryOutcome> {
  // 1. Wake up the database (Crucial for Neon serverless)
  await prisma.$executeRaw`SELECT 1`;

  if (!ctx.adminId) return RecoveryOutcome.AUTH_FAILURE;

  // 2. Start Transaction with increased timeouts
  return await prisma.$transaction(async (tx) => {
    
    // 3. PRE-READ: Grab the missing required fields
    const outboxRow = await tx.notificationOutbox.findUnique({
      where: { id: ctx.outboxId },
      include: { 
        decision: { 
          select: { 
            subscriptionId: true,
            notificationType: true,
            channel: true,
            ruleSetVersionId: true,
            compilerRunId: true
          } 
        } 
      }
    });

    if (!outboxRow) return RecoveryOutcome.NOT_FOUND;
    if (!outboxRow.decision?.subscriptionId) return RecoveryOutcome.INTERNAL_ERROR;
    if (outboxRow.status !== 'DEAD_LETTER') return RecoveryOutcome.INVALID_STATE;

    // 4. ATOMIC GUARDED MUTATION
    const result = await tx.notificationOutbox.updateMany({
      where: { id: ctx.outboxId, status: 'DEAD_LETTER' },
      data: {
        status: 'PENDING',
        retryCount: 0,
        processAt: new Date(),
        claimedAt: null,
        claimedByRunId: null,
        lastError: null,
      },
    });

    if (result.count === 0) return RecoveryOutcome.INVALID_STATE;

    // 5. AUDIT INJECTION
    await tx.notificationDecisionAudit.create({
      data: {
        subscriptionId: outboxRow.decision.subscriptionId,
        persistenceReason: 'MANUAL_RETRY_TRIGGERED',
        cycleKey: "OPERATIONAL_RECOVERY", 
        notificationType: outboxRow.decision.notificationType,
        channel: outboxRow.decision.channel,
        ruleSetVersionId: outboxRow.decision.ruleSetVersionId,
        compilerRunId: outboxRow.decision.compilerRunId,
        metadata: {
          actorId: ctx.adminId,
          reason: ctx.reason,
          previousStatus: 'DEAD_LETTER',
          nextStatus: 'PENDING',
          occurredAt: new Date().toISOString(),
        },
      },
    });

    return RecoveryOutcome.ACCEPTED;

  }, {
    maxWait: 15000, 
    timeout: 20000  
  });
}