import { prisma } from "@/lib/prisma";
import { OutboxStatus, AttemptOutcome } from "@prisma/client";
import { resend } from "@/lib/mail-provider";
import { v4 as uuidv4 } from "uuid";

const MAX_RETRIES = 5;
const BASE_DELAY_SECONDS = 60;
const CLAIM_TTL_MINUTES = 5;

export async function runNotificationDispatch() {
  const workerRunId = uuidv4();

  // 1. STUCK CLAIM RECOVERY
  await prisma.notificationOutbox.updateMany({
    where: {
      status: OutboxStatus.CLAIMED,
      claimedAt: { lt: new Date(Date.now() - CLAIM_TTL_MINUTES * 60000) },
    },
    data: { status: OutboxStatus.PENDING, claimedAt: null, claimedByRunId: null },
  });

  // 2. ATOMIC CLAIM WITH ATTRIBUTION (PostgreSQL SKIP LOCKED)
  // We added ::"OutboxStatus" to tell the DB exactly what type these are.
  const claimBatch = await prisma.$queryRaw<any[]>`
    UPDATE "NotificationOutbox"
    SET status = 'CLAIMED'::"OutboxStatus", 
        "claimedAt" = NOW(), 
        "claimedByRunId" = ${workerRunId}
    WHERE id IN (
      SELECT id FROM "NotificationOutbox"
      WHERE status IN ('PENDING'::"OutboxStatus", 'RETRY_SCHEDULED'::"OutboxStatus")
        AND "processAt" <= NOW()
        AND "retryCount" < ${MAX_RETRIES}
      ORDER BY "processAt" ASC
      LIMIT 10
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
  `;

  for (const task of claimBatch) {
    await executeTransmission(task, workerRunId);
  }
}

async function executeTransmission(task: any, runId: string) {
  let outcome: AttemptOutcome;
  let errorMsg: string | null = null;
  let providerId: string | null = null;
  let haltSignal = false;

  // ... inside executeTransmission
try {
  const response = await resend.emails.send({
    from: "onboarding@resend.dev", // ADD THIS LINE
    ...task.frozenPayload,
    headers: { "X-Entity-Id": task.idempotencyKey },
  });
// ... rest of the code

    if (response.error) throw response.error;
    
    outcome = AttemptOutcome.SUCCESS;
    providerId = response.data?.id || null;

  } catch (error: any) {
    const status = error.statusCode;
    if (status === 429 || status >= 500) {
      outcome = AttemptOutcome.TRANSIENT_FAILURE;
    } else if (status === 401 || status === 403) {
      outcome = AttemptOutcome.PERMANENT_FAILURE;
      haltSignal = true; 
    } else if (status === 422) {
      outcome = AttemptOutcome.PROVIDER_REJECTION; 
    } else {
      outcome = AttemptOutcome.PERMANENT_FAILURE;
    }
    errorMsg = error.message || "Provider Error";
  }

  await prisma.$transaction(async (tx) => {
    await tx.notificationAttemptLog.create({
      data: {
        outboxId: task.id,
        outcome: outcome,
        errorMessage: errorMsg,
        providerMessageId: providerId,
      },
    });

    if (outcome === AttemptOutcome.SUCCESS) {
      await tx.notificationOutbox.update({
        where: { id: task.id },
        data: { status: OutboxStatus.SENT, providerMessageId: providerId },
      });
    } else if (outcome === AttemptOutcome.TRANSIENT_FAILURE && task.retryCount < MAX_RETRIES) {
      const nextDelay = BASE_DELAY_SECONDS * Math.pow(2, task.retryCount);
      await tx.notificationOutbox.update({
        where: { id: task.id },
        data: {
          status: OutboxStatus.RETRY_SCHEDULED,
          retryCount: { increment: 1 },
          processAt: new Date(Date.now() + nextDelay * 1000),
          lastError: errorMsg,
          claimedByRunId: null, 
        },
      });
    } else {
      await tx.notificationOutbox.update({
        where: { id: task.id },
        data: { 
          status: OutboxStatus.DEAD_LETTER, 
          lastError: errorMsg,
          claimedByRunId: null 
        },
      });
    }
  });

  if (haltSignal) {
    console.error(`[CRITICAL] Dispatcher halted: Provider Auth Failure (401/403).`);
    process.exit(1); 
  }
}