-- AlterTable
ALTER TABLE "RuleIdentity" ADD COLUMN     "allowsSubscriptions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSearchable" BOOLEAN NOT NULL DEFAULT true;
