-- AlterTable
ALTER TABLE "User" ADD COLUMN     "shiftEndMin" INTEGER,
ADD COLUMN     "workDays" TEXT NOT NULL DEFAULT '0,1,2,3,4,5,6';


