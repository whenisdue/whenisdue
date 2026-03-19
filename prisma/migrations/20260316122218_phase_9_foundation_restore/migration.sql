/*
  Warnings:

  - You are about to drop the column `claimToken` on the `NotificationOutbox` table. All the data in the column will be lost.
  - You are about to drop the column `recordedFrom` on the `PaymentEvent` table. All the data in the column will be lost.
  - You are about to drop the column `recordedTo` on the `PaymentEvent` table. All the data in the column will be lost.
  - You are about to drop the column `changeReason` on the `ScheduleRuleSet` table. All the data in the column will be lost.
  - You are about to drop the column `recordedFrom` on the `ScheduleRuleSet` table. All the data in the column will be lost.
  - You are about to drop the column `recordedTo` on the `ScheduleRuleSet` table. All the data in the column will be lost.
  - You are about to drop the column `supersedesId` on the `ScheduleRuleSet` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedAt` on the `ScheduleRuleSet` table. All the data in the column will be lost.
  - You are about to drop the column `verifiedBy` on the `ScheduleRuleSet` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `matchCanonical` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `matchType` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `pausedAt` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `programCode` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `rawUserInput` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriptionId,oldEventId,newEventId]` on the table `NotificationDecisionAudit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[idempotencyKey]` on the table `NotificationOutbox` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerMessageId]` on the table `NotificationOutbox` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriberId,stateCode,programCode,identifierValue]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `frozenPayload` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idempotencyKey` to the `NotificationOutbox` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identifierValue` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextDepositDate` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `programCode` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- DropForeignKey
ALTER TABLE "ScheduleRuleSet" DROP CONSTRAINT "ScheduleRuleSet_supersedesId_fkey";

-- DropIndex
DROP INDEX "PaymentEvent_stateCode_programCode_benefitYear_benefitMonth_idx";

-- DropIndex
DROP INDEX "ScheduleRuleSet_identityId_recordedFrom_recordedTo_idx";

-- DropIndex
DROP INDEX "ScheduleRuleSet_supersedesId_key";

-- DropIndex
DROP INDEX "ScheduleRuleSet_validFrom_validTo_idx";

-- DropIndex
DROP INDEX "Subscription_stateCode_programCode_matchType_matchCanonical_idx";

-- AlterTable
ALTER TABLE "NotificationOutbox" DROP COLUMN "claimToken",
ADD COLUMN     "claimedByRunId" TEXT,
ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "firstAttemptAt" TIMESTAMP(3),
ADD COLUMN     "frozenPayload" JSONB NOT NULL,
ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "lastError" TEXT,
ADD COLUMN     "providerMessageId" TEXT;

-- AlterTable
ALTER TABLE "PaymentEvent" DROP COLUMN "recordedFrom",
DROP COLUMN "recordedTo";

-- AlterTable
ALTER TABLE "ScheduleRuleSet" DROP COLUMN "changeReason",
DROP COLUMN "recordedFrom",
DROP COLUMN "recordedTo",
DROP COLUMN "supersedesId",
DROP COLUMN "verifiedAt",
DROP COLUMN "verifiedBy";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "deletedAt",
DROP COLUMN "matchCanonical",
DROP COLUMN "matchType",
DROP COLUMN "pausedAt",
DROP COLUMN "programCode",
DROP COLUMN "rawUserInput",
ADD COLUMN     "identifierValue" TEXT NOT NULL,
ADD COLUMN     "nextDepositDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "programCode" TEXT NOT NULL,
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "RequestLog" (
    "internalId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "responseStatus" INTEGER NOT NULL,
    "responseBody" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestLog_pkey" PRIMARY KEY ("internalId")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestLog_subscriberId_action_idempotencyKey_key" ON "RequestLog"("subscriberId", "action", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDecisionAudit_subscriptionId_oldEventId_newEven_key" ON "NotificationDecisionAudit"("subscriptionId", "oldEventId", "newEventId");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationOutbox_idempotencyKey_key" ON "NotificationOutbox"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationOutbox_providerMessageId_key" ON "NotificationOutbox"("providerMessageId");

-- CreateIndex
CREATE INDEX "PaymentEvent_stateCode_programCode_benefitYear_benefitMonth_idx" ON "PaymentEvent"("stateCode", "programCode", "benefitYear", "benefitMonth");

-- CreateIndex
CREATE INDEX "ScheduleRuleSet_identityId_idx" ON "ScheduleRuleSet"("identityId");

-- CreateIndex
CREATE INDEX "Subscription_subscriberId_idx" ON "Subscription"("subscriberId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriberId_stateCode_programCode_identifierV_key" ON "Subscription"("subscriberId", "stateCode", "programCode", "identifierValue");
