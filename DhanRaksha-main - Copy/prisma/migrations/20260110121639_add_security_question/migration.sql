/*
  Warnings:

  - You are about to drop the column `device` on the `BehaviorSession` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `BehaviorSession` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `BehaviorSession` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `BehaviorSession` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `BehaviorSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "BehaviorSession" DROP COLUMN "device",
DROP COLUMN "ipAddress",
DROP COLUMN "isActive",
DROP COLUMN "location",
DROP COLUMN "userAgent";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "securityAnswer" TEXT,
ADD COLUMN     "securityQuestion" TEXT;
