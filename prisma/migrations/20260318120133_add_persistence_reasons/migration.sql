/*
  Warnings:

  - You are about to drop the column `programCode` on the `Subscription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriberId,stateCode,programCode,identifierValue]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `programCode` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PersistenceReason" AS ENUM ('INACTIVE', 'ALREADY_PAID', 'ALREADY_NOTIFIED', 'OUTSIDE_SCHEDULED_DATE', 'INCONSISTENT_STATE', 'SCHEDULED_TRIGGER_MET', 'INTEGRITY_CONFLICT_ALREADY_SENT', 'BLOCK_IN_FLIGHT_EXISTS', 'BLOCK_RETRY_EXISTS', 'TERMINAL_FAILURE_ENCOUNTERED');

-- DropIndex
DROP INDEX "Subscription_subscriberId_stateCode_programCode_identifierV_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "programCode",
ADD COLUMN     "programCode" TEXT NOT NULL,
ALTER COLUMN "nextDepositDate" SET DATA TYPE DATE;

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_subscriberId_stateCode_programCode_identifierV_key" ON "Subscription"("subscriberId", "stateCode", "programCode", "identifierValue");
