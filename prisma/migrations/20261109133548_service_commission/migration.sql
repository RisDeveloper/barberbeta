/*
  Warnings:

  - You are about to drop the column `description` on the `Service` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Commission" DROP CONSTRAINT "Commission_ruleId_fkey";

-- AlterTable
ALTER TABLE "Commission" ALTER COLUMN "ruleId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "description",
ADD COLUMN     "commissionRp" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "CommissionRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
