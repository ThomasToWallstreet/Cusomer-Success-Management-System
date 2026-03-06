-- AlterTable
ALTER TABLE "public"."CustomerContact"
ADD COLUMN "satisfactionUpdatedAt" TIMESTAMP(3),
ADD COLUMN "satisfactionEvidence" TEXT;
