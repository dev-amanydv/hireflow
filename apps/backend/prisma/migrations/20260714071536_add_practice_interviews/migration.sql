-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('REAL', 'PRACTICE');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "skill" TEXT,
ADD COLUMN     "type" "InterviewType" NOT NULL DEFAULT 'REAL';

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "report" JSONB;
