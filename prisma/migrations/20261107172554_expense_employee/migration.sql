-- AlterTable
ALTER TABLE "ExpenseRecord" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "ExpenseRecord_userId_date_idx" ON "ExpenseRecord"("userId", "date");

-- AddForeignKey
ALTER TABLE "ExpenseRecord" ADD CONSTRAINT "ExpenseRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill old kasbon rows when the employee name is unique in that branch.
UPDATE "ExpenseRecord" e
SET "userId" = u.id
FROM "User" u
WHERE e.category = 'Kasbon'
  AND e."userId" IS NULL
  AND e."branchId" = u."branchId"
  AND e.description = 'Kasbon - ' || u.name
  AND (SELECT COUNT(*) FROM "User" u2
       WHERE u2."branchId" = u."branchId" AND u2.name = u.name AND u2."deletedAt" IS NULL) = 1;
