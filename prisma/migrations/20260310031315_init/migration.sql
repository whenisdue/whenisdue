-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('FEDERAL', 'GAMING', 'SHOPPING', 'TECH', 'OTHER');

-- CreateEnum
CREATE TYPE "EventDateStatus" AS ENUM ('EXACT', 'TBA', 'TBD_MONTH', 'TBD_QUARTER', 'TBD_YEAR');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'MONTHLY_FIXED_DAY', 'MONTHLY_NTH_WEEKDAY', 'MANUAL_DATES');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ANNOUNCED', 'CONFIRMED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('QUEUED', 'PROCESSING', 'SENT', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "TriggerSource" AS ENUM ('CRON', 'MANUAL', 'RETRY');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "EventSeries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slugBase" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "description" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "priorityWeight" INTEGER NOT NULL DEFAULT 5,
    "heroQuestion" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'CONFIRMED',
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "dayOfMonth" INTEGER,
    "nthWeek" INTEGER,
    "weekday" INTEGER,
    "startMonth" TIMESTAMP(3),
    "endMonth" TIMESTAMP(3),
    "autoAdjustBusinessDay" BOOLEAN NOT NULL DEFAULT false,
    "generateCount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "dueAt" TIMESTAMP(3),
    "timeZone" TEXT,
    "dateStatus" "EventDateStatus" NOT NULL DEFAULT 'EXACT',
    "displayYear" INTEGER,
    "displayMonth" INTEGER,
    "displayQuarter" INTEGER,
    "dateLabel" TEXT,
    "trending" BOOLEAN NOT NULL DEFAULT false,
    "isGenerated" BOOLEAN NOT NULL DEFAULT false,
    "isDetached" BOOLEAN NOT NULL DEFAULT false,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "keywords" TEXT,
    "sourceUrl" TEXT,
    "lastVerified" TIMESTAMP(3),
    "shortSummary" TEXT,
    "whatToExpect" TEXT,
    "whereToWatch" TEXT,
    "expectedDuration" TEXT,
    "targetAudience" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventClickStat" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "totalClicks" INTEGER NOT NULL DEFAULT 0,
    "clickCount1h" INTEGER NOT NULL DEFAULT 0,
    "clickCount24h" INTEGER NOT NULL DEFAULT 0,
    "lastClickAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventClickStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expirationTime" TIMESTAMP(3),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserTopicSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "wantsEmail" BOOLEAN NOT NULL DEFAULT false,
    "wantsPush" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserTopicSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaign" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "key" TEXT,
    "triggerSource" "TriggerSource" NOT NULL,
    "status" "CampaignStatus" NOT NULL DEFAULT 'QUEUED',
    "templateKey" TEXT NOT NULL,
    "templateVersion" INTEGER NOT NULL DEFAULT 1,
    "subject" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "totalRecipients" INTEGER NOT NULL DEFAULT 0,
    "batchSize" INTEGER NOT NULL DEFAULT 100,
    "totalBatches" INTEGER NOT NULL DEFAULT 0,
    "queuedBatches" INTEGER NOT NULL DEFAULT 0,
    "processedBatches" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "dedupeKey" TEXT,

    CONSTRAINT "EmailCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaignBatch" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "batchIndex" INTEGER NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'QUEUED',
    "idempotencyKey" TEXT NOT NULL,
    "offsetStart" INTEGER NOT NULL,
    "offsetEndExclusive" INTEGER NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "qstashMessageId" TEXT,
    "qstashNotBefore" TIMESTAMP(3),

    CONSTRAINT "EmailCampaignBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailCampaignRecipient" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "campaignId" TEXT NOT NULL,
    "batchId" TEXT,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "subject" TEXT,
    "payload" JSONB,
    "status" "RecipientStatus" NOT NULL DEFAULT 'PENDING',
    "sendAttemptCount" INTEGER NOT NULL DEFAULT 0,
    "resendEmailId" TEXT,
    "sentAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "dedupeKey" TEXT NOT NULL,

    CONSTRAINT "EmailCampaignRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSubmission" (
    "id" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submittedTitle" TEXT NOT NULL,
    "submittedDate" TEXT,
    "submittedSource" TEXT,
    "submitterIpHash" TEXT,
    "userAgent" TEXT,
    "honeypot" TEXT,
    "reviewerNotes" TEXT,
    "duplicateOfId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageStat" (
    "id" TEXT NOT NULL,
    "routePath" TEXT NOT NULL,
    "slug" TEXT,
    "pageViews" INTEGER NOT NULL DEFAULT 0,
    "uniquePageViews" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageViewDedup" (
    "id" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "routePath" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "bucketDate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageViewDedup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IpRateLimit" (
    "ipHash" TEXT NOT NULL,
    "routeKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IpRateLimit_pkey" PRIMARY KEY ("ipHash","routeKey","windowStart")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventSeries_slugBase_key" ON "EventSeries"("slugBase");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_dateStatus_dueAt_idx" ON "Event"("dateStatus", "dueAt");

-- CreateIndex
CREATE INDEX "Event_dueAt_idx" ON "Event"("dueAt");

-- CreateIndex
CREATE INDEX "Event_seriesId_dueAt_idx" ON "Event"("seriesId", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "EventClickStat_eventId_key" ON "EventClickStat"("eventId");

-- CreateIndex
CREATE INDEX "EventClickStat_clickCount1h_idx" ON "EventClickStat"("clickCount1h");

-- CreateIndex
CREATE INDEX "EventClickStat_clickCount24h_idx" ON "EventClickStat"("clickCount24h");

-- CreateIndex
CREATE INDEX "EventClickStat_lastClickAt_idx" ON "EventClickStat"("lastClickAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "UserTopicSubscription_userId_topicKey_key" ON "UserTopicSubscription"("userId", "topicKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaign_dedupeKey_key" ON "EmailCampaign"("dedupeKey");

-- CreateIndex
CREATE INDEX "EmailCampaign_status_createdAt_idx" ON "EmailCampaign"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailCampaign_templateKey_createdAt_idx" ON "EmailCampaign"("templateKey", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignBatch_idempotencyKey_key" ON "EmailCampaignBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "EmailCampaignBatch_campaignId_status_idx" ON "EmailCampaignBatch"("campaignId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignBatch_campaignId_batchIndex_key" ON "EmailCampaignBatch"("campaignId", "batchIndex");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCampaignRecipient_dedupeKey_key" ON "EmailCampaignRecipient"("dedupeKey");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_campaignId_status_idx" ON "EmailCampaignRecipient"("campaignId", "status");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_batchId_status_idx" ON "EmailCampaignRecipient"("batchId", "status");

-- CreateIndex
CREATE INDEX "EmailCampaignRecipient_normalizedEmail_idx" ON "EmailCampaignRecipient"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_eventId_channel_kind_scheduledFor_key" ON "NotificationDelivery"("eventId", "channel", "kind", "scheduledFor");

-- CreateIndex
CREATE INDEX "EventSubmission_status_createdAt_idx" ON "EventSubmission"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PageStat_routePath_key" ON "PageStat"("routePath");

-- CreateIndex
CREATE UNIQUE INDEX "PageViewDedup_dedupeKey_key" ON "PageViewDedup"("dedupeKey");

-- CreateIndex
CREATE INDEX "PageViewDedup_routePath_bucketDate_idx" ON "PageViewDedup"("routePath", "bucketDate");

-- CreateIndex
CREATE INDEX "IpRateLimit_lastSeenAt_idx" ON "IpRateLimit"("lastSeenAt");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "EventSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventClickStat" ADD CONSTRAINT "EventClickStat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTopicSubscription" ADD CONSTRAINT "UserTopicSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignBatch" ADD CONSTRAINT "EmailCampaignBatch_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "EmailCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCampaignRecipient" ADD CONSTRAINT "EmailCampaignRecipient_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "EmailCampaignBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
