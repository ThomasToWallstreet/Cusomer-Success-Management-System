-- AlterTable
ALTER TABLE "public"."KeySuccessScenario" ADD COLUMN     "customerId" TEXT;

-- AlterTable
ALTER TABLE "public"."WeeklyReport" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "public"."Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "tier" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "public"."Customer"("name");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_customerId_idx" ON "public"."KeySuccessScenario"("customerId");

-- CreateIndex
CREATE INDEX "WeeklyReport_customerId_weekStart_idx" ON "public"."WeeklyReport"("customerId", "weekStart");

-- AddForeignKey
ALTER TABLE "public"."KeySuccessScenario" ADD CONSTRAINT "KeySuccessScenario_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReport" ADD CONSTRAINT "WeeklyReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

