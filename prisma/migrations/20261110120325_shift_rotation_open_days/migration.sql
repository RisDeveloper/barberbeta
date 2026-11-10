-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "closeTimeMin" INTEGER NOT NULL DEFAULT 1080,
ADD COLUMN     "openDays" TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shiftRotation" JSONB,
ADD COLUMN     "shiftRotationStart" TIMESTAMP(3);


