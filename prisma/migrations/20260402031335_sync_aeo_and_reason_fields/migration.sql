/*
  Warnings:

  - The values [DATE_SHIFT_DETECTED,RULE_CHANGE_NOTIFICATION,INITIAL_VERIFICATION_SUCCESS] on the enum `DecisionReason` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PROVISIONAL', 'VERIFIED', 'OFFICIAL_API', 'COMMUNITY_CONSENSUS');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('CASE_DIGIT', 'ALPHABETIC_RANGE', 'SSN_LAST_FOUR', 'MONTHLY_STATIC', 'MONTH_SPECIFIC', 'WEEK_NUMBER', 'NUMERIC_RANGE');

-- CreateEnum
CREATE TYPE "DateOffsetStrategy" AS ENUM ('PREV_BUSINESS_DAY', 'NEXT_BUSINESS_DAY', 'NEAREST_BUSINESS_DAY', 'EXACT_CALENDAR_DATE', 'NO_SHIFT', 'WEEKEND_SENSITIVE', 'BUSINESS_DAY_STAGGER');

-- CreateEnum
CREATE TYPE "CohortType" AS ENUM ('PRE_JUNE_2020', 'POST_JUNE_2020', 'NYC_A_CYCLE', 'NYC_B_CYCLE', 'UPSTATE', 'STANDARD', 'GEORGIA_STANDARD');

-- AlterEnum
BEGIN;
CREATE TYPE "DecisionReason_new" AS ENUM ('SSN_LAST_DIGIT', 'SSN_LAST_TWO_DIGITS', 'CASE_NUMBER_LAST_DIGIT', 'CASE_NUMBER_LAST_TWO_DIGITS', 'CLIENT_ID_MODULO', 'NAME_ALPHABETICAL_GROUP', 'WEEKEND_SHIFT_FORWARD', 'WEEKEND_SHIFT_BACKWARD', 'FEDERAL_HOLIDAY_SHIFT_FORWARD', 'FEDERAL_HOLIDAY_SHIFT_BACKWARD', 'EARLY_ISSUANCE_PRE_HOLIDAY', 'FLORIDA_REVERSED_DIGIT_LOGIC', 'TEXAS_SPLIT_SCHEDULE', 'CALIFORNIA_COUNTY_BASED', 'NEW_YORK_BOROUGH_DISTRIBUTION', 'STATE_MANUAL_OVERRIDE', 'INITIAL_APPLICATION_ISSUANCE', 'EXPEDITED_BENEFITS', 'RETROACTIVE_BENEFITS', 'DISASTER_SNAP_DSNAP', 'SUPPLEMENTAL_BENEFIT', 'CORRECTIVE_ADJUSTMENT', 'BIRTH_DATE_RANGE', 'HOUSEHOLD_SIZE_GROUP', 'BENEFIT_GROUP_PHASE', 'GEOGRAPHIC_STAGGER', 'CASELOAD_DISTRIBUTION', 'SYSTEM_BATCH_PROCESSING', 'PAYMENT_CYCLE_STANDARD', 'MIGRATION_LEGACY_SYSTEM', 'MANUAL_ADMIN_OVERRIDE');
ALTER TABLE "Subscription" ALTER COLUMN "nextDepositReason" TYPE "DecisionReason_new" USING ("nextDepositReason"::text::"DecisionReason_new");
ALTER TABLE "PaymentEvent" ALTER COLUMN "reason" TYPE "DecisionReason_new" USING ("reason"::text::"DecisionReason_new");
ALTER TYPE "DecisionReason" RENAME TO "DecisionReason_old";
ALTER TYPE "DecisionReason_new" RENAME TO "DecisionReason";
DROP TYPE "public"."DecisionReason_old";
COMMIT;

-- AlterEnum
ALTER TYPE "PersistenceReason" ADD VALUE 'MANUAL_RETRY_TRIGGERED';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PROVISIONAL';

-- AlterTable
ALTER TABLE "NotificationDecisionAudit" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "PaymentEvent" ADD COLUMN     "reason" "DecisionReason" NOT NULL DEFAULT 'PAYMENT_CYCLE_STANDARD',
ADD COLUMN     "reasonDetails" JSONB;

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "nextDepositDetails" JSONB,
ADD COLUMN     "nextDepositReason" "DecisionReason" NOT NULL DEFAULT 'PAYMENT_CYCLE_STANDARD';

-- CreateTable
CREATE TABLE "State" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "abbreviation" TEXT NOT NULL,
    "officialUrl" TEXT,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "cohortKey" "CohortType" NOT NULL DEFAULT 'STANDARD',
    "triggerType" "TriggerType" NOT NULL,
    "triggerStart" TEXT NOT NULL,
    "triggerEnd" TEXT,
    "baseDay" INTEGER NOT NULL,
    "offsetStrategy" "DateOffsetStrategy" NOT NULL DEFAULT 'PREV_BUSINESS_DAY',
    "sourceCitation" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualEvent" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "sourceCitation" TEXT,

    CONSTRAINT "ManualEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "State_name_key" ON "State"("name");

-- CreateIndex
CREATE UNIQUE INDEX "State_slug_key" ON "State"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "State_abbreviation_key" ON "State"("abbreviation");

-- CreateIndex
CREATE UNIQUE INDEX "Program_stateId_name_key" ON "Program"("stateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Rule_programId_cohortKey_triggerStart_triggerEnd_key" ON "Rule"("programId", "cohortKey", "triggerStart", "triggerEnd");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualEvent" ADD CONSTRAINT "ManualEvent_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "State"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
