/*
  Warnings:

  - You are about to drop the column `titleSearch` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `titleSearch` on the `EventSubmission` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "event_title_search_trgm_idx";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "titleSearch";

-- AlterTable
ALTER TABLE "EventSubmission" DROP COLUMN "titleSearch";
