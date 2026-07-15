/*
  Warnings:

  - You are about to drop the column `Resume` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ResumeParseStatus" AS ENUM ('PARSING', 'PARSED', 'FAILED');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "Resume",
ADD COLUMN     "resumeError" TEXT,
ADD COLUMN     "resumeKey" TEXT,
ADD COLUMN     "resumeStatus" "ResumeParseStatus",
ADD COLUMN     "summary" JSONB;
