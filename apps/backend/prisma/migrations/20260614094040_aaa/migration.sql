-- DropForeignKey
ALTER TABLE "Interview" DROP CONSTRAINT "Interview_resultId_fkey";

-- AlterTable
ALTER TABLE "Interview" ALTER COLUMN "resultId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "refreshToken" TEXT;

-- AddForeignKey
ALTER TABLE "Interview" ADD CONSTRAINT "Interview_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE SET NULL ON UPDATE CASCADE;
