-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "analyzedAt" TIMESTAMP(3),
ADD COLUMN     "schemaVersion" INTEGER NOT NULL DEFAULT 2;
