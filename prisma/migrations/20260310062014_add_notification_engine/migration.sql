/*
  Warnings:

  - You are about to drop the column `kind` on the `NotificationDelivery` table. All the data in the column will be lost.
  - You are about to drop the column `expirationTime` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `PushSubscription` table. All the data in the column will be lost.
  - You are about to drop the `EmailCampaign` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmailCampaignBatch` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmailCampaignRecipient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[dedupeKey]` on the table `NotificationDelivery` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dedupeKey` to the `NotificationDelivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientFingerprint` to the `NotificationDelivery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `NotificationDelivery` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `channel` on the `NotificationDelivery` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'INVALID_ENDPOINT');

-- DropForeignKey
ALTER TABLE "EmailCampaignBatch" DROP CONSTRAINT "EmailCampaignBatch_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "EmailCampaignRecipient" DROP CONSTRAINT "EmailCampaignRecipient_batchId_fkey";

-- DropForeignKey
ALTER TABLE "EmailCampaignRecipient" DROP CONSTRAINT "EmailCampaignRecipient_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "PushSubscription" DROP CONSTRAINT "PushSubscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserTopicSubscription" DROP CONSTRAINT "UserTopicSubscription_userId_fkey";

-- DropIndex
DROP INDEX "NotificationDelivery_eventId_channel_kind_scheduledFor_key";

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "titleSearch" TEXT;

-- AlterTable
ALTER TABLE "EventSubmission" ADD COLUMN     "titleSearch" TEXT;

-- AlterTable
ALTER TABLE "NotificationDelivery" DROP COLUMN "kind",
ADD COLUMN     "attemptCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dedupeKey" TEXT NOT NULL,
ADD COLUMN     "errorLog" TEXT,
ADD COLUMN     "providerMessageId" TEXT,
ADD COLUMN     "recipientFingerprint" TEXT NOT NULL,
ADD COLUMN     "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "channel",
ADD COLUMN     "channel" "NotificationChannel" NOT NULL,
ALTER COLUMN "sentAt" DROP NOT NULL,
ALTER COLUMN "sentAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PushSubscription" DROP COLUMN "expirationTime",
DROP COLUMN "isActive",
DROP COLUMN "status",
DROP COLUMN "userAgent",
ADD COLUMN     "failureCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isValid" BOOLEAN NOT NULL DEFAULT true;

-- DropTable
DROP TABLE "EmailCampaign";

-- DropTable
DROP TABLE "EmailCampaignBatch";

-- DropTable
DROP TABLE "EmailCampaignRecipient";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "BatchStatus";

-- DropEnum
DROP TYPE "CampaignStatus";

-- DropEnum
DROP TYPE "RecipientStatus";

-- DropEnum
DROP TYPE "TriggerSource";

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_dedupeKey_key" ON "NotificationDelivery"("dedupeKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_status_scheduledFor_idx" ON "NotificationDelivery"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "NotificationDelivery_eventId_idx" ON "NotificationDelivery"("eventId");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");
