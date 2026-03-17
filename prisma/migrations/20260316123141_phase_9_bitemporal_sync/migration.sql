-- DropIndex
DROP INDEX "PaymentEvent_stateCode_programCode_benefitYear_benefitMonth_idx";

-- DropIndex
DROP INDEX "ScheduleRuleSet_identityId_idx";

-- AlterTable
ALTER TABLE "PaymentEvent" ADD COLUMN     "recordedFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recordedTo" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ScheduleRuleSet" ADD COLUMN     "changeReason" TEXT,
ADD COLUMN     "recordedFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "recordedTo" TIMESTAMP(3),
ADD COLUMN     "verifiedAt" TIMESTAMP(3),
ADD COLUMN     "verifiedBy" TEXT;

-- CreateIndex
CREATE INDEX "PaymentEvent_stateCode_programCode_benefitYear_benefitMonth_idx" ON "PaymentEvent"("stateCode", "programCode", "benefitYear", "benefitMonth", "recordedFrom", "recordedTo");

-- CreateIndex
CREATE INDEX "ScheduleRuleSet_identityId_recordedFrom_recordedTo_idx" ON "ScheduleRuleSet"("identityId", "recordedFrom", "recordedTo");
