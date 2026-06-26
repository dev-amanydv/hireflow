-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('mixed', 'behavioural', 'technical', 'systemDesign');

-- CreateEnum
CREATE TYPE "Experience" AS ENUM ('beginner', 'junior', 'mid', 'senior', 'staff');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "duration" INTEGER DEFAULT 15,
ADD COLUMN     "experience" "Experience" NOT NULL DEFAULT 'beginner',
ADD COLUMN     "question" INTEGER DEFAULT 5,
ADD COLUMN     "resume" TEXT,
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "type" "InterviewType" NOT NULL DEFAULT 'mixed';
