/*
  Warnings:

  - The values [PROCESSING,COMPLETED,FETCHING] on the enum `UploadStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UploadStatus_new" AS ENUM ('UPLOADED_LOCAL', 'PARSING', 'PARSED', 'COMPLETE', 'FAILED');
ALTER TABLE "public"."Resume" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Resume" ALTER COLUMN "status" TYPE "UploadStatus_new" USING ("status"::text::"UploadStatus_new");
ALTER TYPE "UploadStatus" RENAME TO "UploadStatus_old";
ALTER TYPE "UploadStatus_new" RENAME TO "UploadStatus";
DROP TYPE "public"."UploadStatus_old";
ALTER TABLE "Resume" ALTER COLUMN "status" SET DEFAULT 'UPLOADED_LOCAL';
COMMIT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "parsed" JSONB;
