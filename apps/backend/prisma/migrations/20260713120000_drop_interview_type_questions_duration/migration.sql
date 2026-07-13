/*
  Warnings:

  - You are about to drop the column `duration` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `question` on the `Interview` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Interview` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Interview" DROP COLUMN "duration",
DROP COLUMN "question",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "InterviewType";
