-- 1. Index for high-performance polling
CREATE INDEX "outbox_polling_idx" ON "NotificationOutbox" ("status", "processAt") 
WHERE "status" IN ('PENDING', 'RETRY_SCHEDULED');

-- 2. Idempotency Circuit Breaker
CREATE UNIQUE INDEX "outbox_sent_idempotency_idx" 
ON "NotificationOutbox" ("idempotencyKey") 
WHERE "status" = 'SENT';

-- 3. Add the attribution field
ALTER TABLE "NotificationOutbox" ADD COLUMN IF NOT EXISTS "claimedByRunId" TEXT;