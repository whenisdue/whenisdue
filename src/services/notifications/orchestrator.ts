import { PersistenceReason, DecisionReason } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * DETERMINISTIC PERSISTENCE ORCHESTRATOR
 * Executes the Green-Lighted Matrix for Phase 11.
 */
export async function processSubscriptionEvaluation(ctx: {
  subscriptionId: string;
  cycleKey: string;
  notificationType: string;
  channel: string;
  ruleSetVersionId: string; // Added to satisfy mandatory relation
  compilerRunId: string;    // Added to satisfy mandatory relation
  engineOutcome: 'SEND' | 'SKIP' | 'ERROR';
  engineReason: string;
  outboxCategory: 'NONE' | 'SUCCESS_PRESENT' | 'IN_FLIGHT_PRESENT' | 'RETRYABLE_PRESENT' | 'TERMINAL_FAILURE_PRESENT';
  frozenPayload: any;
}) {
  // 1. RESOLVE PERSISTENCE REASON (THE MAPPING)
  let persistenceReason: PersistenceReason;

  if (ctx.engineOutcome === 'SEND') {
    // Map Collision Categories
    const collisionMap = {
      NONE: PersistenceReason.SCHEDULED_TRIGGER_MET,
      SUCCESS_PRESENT: PersistenceReason.INTEGRITY_CONFLICT_ALREADY_SENT,
      IN_FLIGHT_PRESENT: PersistenceReason.BLOCK_IN_FLIGHT_EXISTS,
      RETRYABLE_PRESENT: PersistenceReason.BLOCK_RETRY_EXISTS,
      TERMINAL_FAILURE_PRESENT: PersistenceReason.TERMINAL_FAILURE_ENCOUNTERED,
    };
    persistenceReason = collisionMap[ctx.outboxCategory];
  } else {
    // Provenance Enforcement for ALREADY_NOTIFIED
    if (ctx.engineReason === 'ALREADY_NOTIFIED' && ctx.outboxCategory !== 'SUCCESS_PRESENT') {
      persistenceReason = PersistenceReason.INCONSISTENT_STATE;
      console.error(`[INTEGRITY_ALERT] Engine reported ALREADY_NOTIFIED but Outbox Category was ${ctx.outboxCategory}`);
    } else {
      persistenceReason = ctx.engineReason as PersistenceReason;
    }
  }

  // 2. FETCH LATEST PRIOR AUDIT (DETERMINISTIC ORDERING)
  const latestAudit = await prisma.notificationDecisionAudit.findFirst({
    where: {
      subscriptionId: ctx.subscriptionId,
      cycleKey: ctx.cycleKey,
      notificationType: ctx.notificationType,
      channel: ctx.channel,
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });

  // 3. SUPPRESSION CHECK (EXACT EQUALITY ONLY)
  if (latestAudit?.persistenceReason === persistenceReason) {
    return { action: 'SUPPRESS_DUPLICATE', reason: persistenceReason };
  }

  // 4. ATOMIC EXECUTION (PRISMA TRANSACTION)
  return await prisma.$transaction(async (tx) => {
    // Create Audit Entry (Mandatory if not suppressed)
    const audit = await tx.notificationDecisionAudit.create({
      data: {
        subscriptionId: ctx.subscriptionId,
        cycleKey: ctx.cycleKey,
        notificationType: ctx.notificationType,
        channel: ctx.channel,
        persistenceReason: persistenceReason,
        ruleSetVersionId: ctx.ruleSetVersionId,
        compilerRunId: ctx.compilerRunId,
              },
    });

    // Create Outbox Entry (Only if SCHEDULED_TRIGGER_MET)
    if (persistenceReason === PersistenceReason.SCHEDULED_TRIGGER_MET) {
      await tx.notificationOutbox.create({
        data: {
          decisionAuditId: audit.id,
          status: 'PENDING',
          idempotencyKey: `send-${ctx.subscriptionId}-${ctx.cycleKey}-${ctx.notificationType}`,
          frozenPayload: ctx.frozenPayload,
        },
      });
      return { action: 'WRITE_AUDIT_AND_OUTBOX', reason: persistenceReason };
    }

    return { action: 'WRITE_AUDIT_ONLY', reason: persistenceReason };
  });
}