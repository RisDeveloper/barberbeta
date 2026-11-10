/*
  Warnings:

  - You are about to drop the column `closeTimeMin` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `openDays` on the `Branch` table. All the data in the column will be lost.
  - You are about to drop the column `shiftRotation` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `shiftRotationStart` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Branch" DROP COLUMN "closeTimeMin",
DROP COLUMN "openDays";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "shiftRotation",
DROP COLUMN "shiftRotationStart";


