-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('UPLOADING', 'PARSING', 'PARSED', 'ANALYZING', 'COMPLETE', 'FAILED');

-- CreateTable
CREATE TABLE "ResumeAnalysis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" DOUBLE PRECISION NOT NULL,
    "ext" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'UPLOADING',
    "url" TEXT,
    "parsed" JSONB,
    "summary" JSONB,
    "targetRole" TEXT,
    "targetExperience" "Experience",
    "targetJobId" TEXT,
    "targetJdText" TEXT,
    "overallScore" DOUBLE PRECISION,
    "report" JSONB,
    "error" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResumeAnalysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ResumeAnalysis_userId_idx" ON "ResumeAnalysis"("userId");

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_targetJobId_fkey" FOREIGN KEY ("targetJobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResumeAnalysis" ADD CONSTRAINT "ResumeAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
