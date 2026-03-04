-- DropIndex
DROP INDEX "public"."CustomerContact_customerId_status_idx";

-- AlterTable
ALTER TABLE "public"."CustomerContact"
ADD COLUMN "satisfactionCurrent" TEXT NOT NULL DEFAULT '无感知',
ADD COLUMN "satisfactionTarget" TEXT NOT NULL DEFAULT '认可';

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_satisfactionCurrent_idx" ON "public"."CustomerContact"("customerId", "satisfactionCurrent");

-- DropColumn
ALTER TABLE "public"."CustomerContact" DROP COLUMN "status";
