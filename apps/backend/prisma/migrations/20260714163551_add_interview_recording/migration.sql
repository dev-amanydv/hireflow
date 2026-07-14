-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('NONE', 'PROCESSING', 'READY', 'FAILED');

-- AlterTable
ALTER TABLE "Interview" ADD COLUMN     "recordingDurationMs" INTEGER,
ADD COLUMN     "recordingKey" TEXT,
ADD COLUMN     "recordingStatus" "RecordingStatus" NOT NULL DEFAULT 'NONE';
