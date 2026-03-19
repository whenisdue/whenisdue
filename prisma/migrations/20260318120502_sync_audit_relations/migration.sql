/*
  Warnings:

  - You are about to drop the column `reason` on the `NotificationDecisionAudit` table. All the data in the column will be lost.
  - Added the required column `channel` to the `NotificationDecisionAudit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cycleKey` to the `NotificationDecisionAudit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `notificationType` to the `NotificationDecisionAudit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `persistenceReason` to the `NotificationDecisionAudit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "NotificationDecisionAudit" DROP CONSTRAINT "NotificationDecisionAudit_newEventId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationDecisionAudit" DROP CONSTRAINT "NotificationDecisionAudit_oldEventId_fkey";

-- AlterTable
ALTER TABLE "NotificationDecisionAudit" DROP COLUMN "reason",
ADD COLUMN     "channel" TEXT NOT NULL,
ADD COLUMN     "cycleKey" TEXT NOT NULL,
ADD COLUMN     "notificationType" TEXT NOT NULL,
ADD COLUMN     "persistenceReason" "PersistenceReason" NOT NULL;

-- CreateIndex
CREATE INDEX "NotificationDecisionAudit_subscriptionId_cycleKey_notificat_idx" ON "NotificationDecisionAudit"("subscriptionId", "cycleKey", "notificationType", "channel");

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_oldEventId_fkey" FOREIGN KEY ("oldEventId") REFERENCES "PaymentEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_newEventId_fkey" FOREIGN KEY ("newEventId") REFERENCES "PaymentEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
