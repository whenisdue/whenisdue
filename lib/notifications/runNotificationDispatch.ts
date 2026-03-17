import { randomUUID } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { OutboxStatus, Prisma } from '@prisma/client';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type DispatchTask = Prisma.NotificationOutboxGetPayload<{}>;

async function sendEmail(task: DispatchTask) {
  const payload = task.frozenPayload as { from: string; to: string; subject: string; html: string };

  return await resend.emails.send(
    {
      from: payload.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    },
    {
      idempotencyKey: task.idempotencyKey 
    }
  );
}

export async function runNotificationDispatch(input: { trigger: string }) {
  const runId = randomUUID();
  const now = new Date();
  const BATCH_SIZE = 50;
  const LEASE_DURATION = 1000 * 60 * 10;
  
  const metrics = { claimed: 0, sent: 0, reconciledSent: 0, retried: 0, deadLettered: 0, leaseLost: 0, recovered: 0 };

  // 1. RECOVERY
  const recovery = await prisma.notificationOutbox.updateMany({
    where: { status: OutboxStatus.CLAIMED, expiresAt: { lte: now } },
    data: { status: OutboxStatus.PENDING, claimedByRunId: null, claimedAt: null, expiresAt: null }
  });
  metrics.recovered = recovery.count;

  // 2. DETERMINISTIC SELECTION
  const candidates = await prisma.notificationOutbox.findMany({
    where: { status: OutboxStatus.PENDING, processAt: { lte: now }, claimedByRunId: null },
    orderBy: [{ processAt: 'asc' }, { id: 'asc' }],
    take: BATCH_SIZE,
    select: { id: true }
  });

  if (candidates.length === 0) return { ok: true, status: "idle", metrics };

  // 3. ATOMIC CLAIM
  const claimResult = await prisma.notificationOutbox.updateMany({
    where: {
      id: { in: candidates.map(r => r.id) },
      status: OutboxStatus.PENDING,
      processAt: { lte: now },
      claimedByRunId: null 
    },
    data: {
      status: OutboxStatus.CLAIMED,
      claimedByRunId: runId,
      claimedAt: now,
      expiresAt: new Date(now.getTime() + LEASE_DURATION)
    }
  });

  metrics.claimed = claimResult.count;

  // 4. ISOLATED PROCESSING
  const tasks = (await prisma.notificationOutbox.findMany({
    where: { claimedByRunId: runId },
    orderBy: [{ processAt: 'asc' }, { id: 'asc' }]
  })) as DispatchTask[];

  for (const task of tasks) {
    try {
      // EVIDENCE RECONCILIATION
      if (task.providerMessageId) {
        const update = await prisma.notificationOutbox.updateMany({
          where: { id: task.id, claimedByRunId: runId },
          data: { 
            status: OutboxStatus.SENT, 
            claimedByRunId: null, 
            claimedAt: null, 
            expiresAt: null,
            lastError: null 
          }
        });
        if (update.count === 1) metrics.reconciledSent++;
        else metrics.leaseLost++;
        continue;
      }

      // LEASE-VERIFIED PRE-FLIGHT MARKER
      if (!task.firstAttemptAt) {
        const attemptNow = new Date(); 
        const markerUpdate = await prisma.notificationOutbox.updateMany({
          where: { id: task.id, claimedByRunId: runId, firstAttemptAt: null },
          data: { firstAttemptAt: attemptNow }
        });

        if (markerUpdate.count === 1) {
          task.firstAttemptAt = attemptNow;
        } else {
          metrics.leaseLost++;
          continue; 
        }
      }

      // HORIZON CHECK
      const taskAgeHours = (new Date().getTime() - task.firstAttemptAt.getTime()) / (1000 * 60 * 60);
      if (taskAgeHours > 23) {
        const update = await prisma.notificationOutbox.updateMany({
          where: { id: task.id, claimedByRunId: runId },
          data: {
            status: OutboxStatus.DEAD_LETTER,
            lastError: "STALE_RECOVERY_ABORTED: Horizon Exceeded",
            claimedByRunId: null,
            claimedAt: null,
            expiresAt: null
          }
        });
        if (update.count === 1) metrics.deadLettered++;
        else metrics.leaseLost++;
        continue;
      }

      const { data, error } = await sendEmail(task);
      if (error) throw error;

      if (!data?.id) {
        throw new Error("PROVIDER_ACCEPTED_WITHOUT_MESSAGE_ID");
      }

      // ATOMIC COMMIT
      const update = await prisma.notificationOutbox.updateMany({
        where: { id: task.id, claimedByRunId: runId },
        data: { 
          status: OutboxStatus.SENT, 
          providerMessageId: data.id, 
          claimedByRunId: null, 
          claimedAt: null,
          expiresAt: null,
          lastError: null
        }
      });

      if (update.count === 1) metrics.sent++;
      else metrics.leaseLost++;

    } catch (e: any) {
      const isPermanent = [400, 403, 404].includes(e?.status);
      const shouldRetry = task.retryCount < 3 && !isPermanent;

      const update = await prisma.notificationOutbox.updateMany({
        where: { id: task.id, claimedByRunId: runId },
        data: {
          status: shouldRetry ? OutboxStatus.PENDING : OutboxStatus.DEAD_LETTER,
          processAt: shouldRetry ? new Date(Date.now() + 1000 * 60 * 15) : undefined,
          retryCount: shouldRetry ? { increment: 1 } : undefined,
          lastError: String(e?.message || e),
          claimedByRunId: null,
          claimedAt: null,
          expiresAt: null
        }
      });
      
      if (update.count === 1) {
        if (shouldRetry) metrics.retried++; else metrics.deadLettered++;
      } else {
        metrics.leaseLost++;
      }
    }
  }

  return { ok: true, runId, metrics, durationMs: Date.now() - now.getTime() };
}