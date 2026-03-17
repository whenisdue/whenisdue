-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('FEDERAL', 'STATE', 'TAX', 'MARKETS', 'GAMING', 'SHOPPING', 'TECH', 'OTHER');

-- CreateEnum
CREATE TYPE "EventDateStatus" AS ENUM ('EXACT', 'TBA', 'TBD_MONTH', 'TBD_QUARTER', 'TBD_YEAR');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'MONTHLY_FIXED_DAY', 'MONTHLY_NTH_WEEKDAY', 'MANUAL_DATES');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('ANNOUNCED', 'CONFIRMED', 'LIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'PUSH');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED_RETRYABLE', 'FAILED_FINAL', 'INVALID_ENDPOINT');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'REVIEWED', 'VERIFIED', 'ACTIVE', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "ShiftCause" AS ENUM ('WEEKEND', 'HOLIDAY', 'BUSINESS_DAY', 'NONE');

-- CreateEnum
CREATE TYPE "AppliedPolicy" AS ENUM ('PREVIOUS_BUSINESS_DAY', 'NEXT_BUSINESS_DAY', 'SAME_DAY', 'NO_SHIFT');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'CLAIMED', 'RETRY_SCHEDULED', 'SENT', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "AttemptOutcome" AS ENUM ('SUCCESS', 'TRANSIENT_FAILURE', 'PERMANENT_FAILURE', 'PROVIDER_REJECTION');

-- CreateEnum
CREATE TYPE "IdentifierMatchType" AS ENUM ('CASE_NUMBER_LAST_DIGIT', 'CASE_NUMBER_REMAINDER', 'BIRTH_DATE_DAY', 'LAST_NAME_INITIAL');

-- CreateEnum
CREATE TYPE "DecisionReason" AS ENUM ('DATE_SHIFT_DETECTED', 'RULE_CHANGE_NOTIFICATION', 'INITIAL_VERIFICATION_SUCCESS');

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
    "scheduleRules" JSONB,
    "faqData" JSONB,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "titleSearch" TEXT,
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
    "titleSearch" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSubmission_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "normalizedEmail" TEXT NOT NULL,
    "verifiedEmail" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "programCode" TEXT NOT NULL DEFAULT 'SNAP',
    "matchType" "IdentifierMatchType" NOT NULL,
    "matchCanonical" TEXT NOT NULL,
    "rawUserInput" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pausedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationDecisionAudit" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "compilerRunId" TEXT NOT NULL,
    "ruleSetVersionId" TEXT NOT NULL,
    "oldEventId" TEXT,
    "newEventId" TEXT,
    "reason" "DecisionReason" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDecisionAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "decisionAuditId" TEXT NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "processAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "claimToken" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationAttemptLog" (
    "id" TEXT NOT NULL,
    "outboxId" TEXT NOT NULL,
    "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" "AttemptOutcome" NOT NULL,
    "errorMessage" TEXT,
    "providerMessageId" TEXT,

    CONSTRAINT "NotificationAttemptLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleIdentity" (
    "id" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "ruleFamily" TEXT NOT NULL DEFAULT 'FULL_SCHEDULE',

    CONSTRAINT "RuleIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRuleSet" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedTo" TIMESTAMP(3),
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "changeReason" TEXT,
    "supersedesId" TEXT,
    "identifierKind" TEXT NOT NULL,
    "issuanceWindow" TEXT NOT NULL,
    "windowBasis" TEXT NOT NULL,
    "holidayPolicy" TEXT NOT NULL,
    "masterSequenceJson" JSONB NOT NULL,
    "sourceAuthority" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,

    CONSTRAINT "ScheduleRuleSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompilerRun" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "compilerVersion" TEXT NOT NULL,
    "initiatedBy" TEXT,
    "note" TEXT,

    CONSTRAINT "CompilerRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentEvent" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "batchId" TEXT NOT NULL,
    "ruleSetId" TEXT NOT NULL,
    "recordedFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedTo" TIMESTAMP(3),
    "stateCode" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "benefitYear" INTEGER NOT NULL,
    "benefitMonth" INTEGER NOT NULL,
    "nominalDepositDay" INTEGER NOT NULL,
    "depositDate" TIMESTAMP(3) NOT NULL,
    "identifierKind" TEXT NOT NULL,
    "identifierMatch" TEXT NOT NULL,
    "isShifted" BOOLEAN NOT NULL DEFAULT false,
    "shiftCause" "ShiftCause" NOT NULL DEFAULT 'NONE',
    "appliedPolicy" "AppliedPolicy" NOT NULL DEFAULT 'NO_SHIFT',

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "EventSubmission_status_createdAt_idx" ON "EventSubmission"("status", "createdAt");

-- CreateIndex
CREATE INDEX "IpRateLimit_lastSeenAt_idx" ON "IpRateLimit"("lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "PageStat_routePath_key" ON "PageStat"("routePath");

-- CreateIndex
CREATE UNIQUE INDEX "PageViewDedup_dedupeKey_key" ON "PageViewDedup"("dedupeKey");

-- CreateIndex
CREATE INDEX "PageViewDedup_routePath_bucketDate_idx" ON "PageViewDedup"("routePath", "bucketDate");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_normalizedEmail_key" ON "Subscriber"("normalizedEmail");

-- CreateIndex
CREATE INDEX "Subscription_stateCode_programCode_matchType_matchCanonical_idx" ON "Subscription"("stateCode", "programCode", "matchType", "matchCanonical");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationOutbox_decisionAuditId_key" ON "NotificationOutbox"("decisionAuditId");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_processAt_idx" ON "NotificationOutbox"("status", "processAt");

-- CreateIndex
CREATE UNIQUE INDEX "RuleIdentity_stateCode_programCode_ruleFamily_key" ON "RuleIdentity"("stateCode", "programCode", "ruleFamily");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRuleSet_supersedesId_key" ON "ScheduleRuleSet"("supersedesId");

-- CreateIndex
CREATE INDEX "ScheduleRuleSet_identityId_recordedFrom_recordedTo_idx" ON "ScheduleRuleSet"("identityId", "recordedFrom", "recordedTo");

-- CreateIndex
CREATE INDEX "ScheduleRuleSet_validFrom_validTo_idx" ON "ScheduleRuleSet"("validFrom", "validTo");

-- CreateIndex
CREATE INDEX "PaymentEvent_stateCode_programCode_benefitYear_benefitMonth_idx" ON "PaymentEvent"("stateCode", "programCode", "benefitYear", "benefitMonth", "identifierKind", "identifierMatch", "recordedFrom", "recordedTo");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "EventSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventClickStat" ADD CONSTRAINT "EventClickStat_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_compilerRunId_fkey" FOREIGN KEY ("compilerRunId") REFERENCES "CompilerRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_ruleSetVersionId_fkey" FOREIGN KEY ("ruleSetVersionId") REFERENCES "ScheduleRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_oldEventId_fkey" FOREIGN KEY ("oldEventId") REFERENCES "PaymentEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_newEventId_fkey" FOREIGN KEY ("newEventId") REFERENCES "PaymentEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationDecisionAudit" ADD CONSTRAINT "NotificationDecisionAudit_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_decisionAuditId_fkey" FOREIGN KEY ("decisionAuditId") REFERENCES "NotificationDecisionAudit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationAttemptLog" ADD CONSTRAINT "NotificationAttemptLog_outboxId_fkey" FOREIGN KEY ("outboxId") REFERENCES "NotificationOutbox"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRuleSet" ADD CONSTRAINT "ScheduleRuleSet_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "RuleIdentity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRuleSet" ADD CONSTRAINT "ScheduleRuleSet_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "ScheduleRuleSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "CompilerRun"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentEvent" ADD CONSTRAINT "PaymentEvent_ruleSetId_fkey" FOREIGN KEY ("ruleSetId") REFERENCES "ScheduleRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enforce Option A: Uniqueness only for active subscriptions
CREATE UNIQUE INDEX subscription_active_unique
ON "Subscription" (
  "subscriberId", 
  "stateCode", 
  "programCode", 
  "matchType", 
  "matchCanonical"
)
WHERE "deletedAt" IS NULL;