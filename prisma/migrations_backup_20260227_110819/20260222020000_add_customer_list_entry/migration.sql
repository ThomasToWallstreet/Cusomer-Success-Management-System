-- CreateTable
CREATE TABLE "public"."CustomerListEntry" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "groupBranch" TEXT,
    "industry" TEXT,
    "customerType" TEXT,
    "customerStage" TEXT,
    "annualCapacity" TEXT,
    "order25" TEXT,
    "performance25" TEXT,
    "order26" TEXT,
    "performance26" TEXT,
    "growthOrder" TEXT,
    "growthPerformance" TEXT,
    "sales" TEXT,
    "preSalesSecurity" TEXT,
    "preSalesCloud" TEXT,
    "accountServiceManager" TEXT,
    "remark" TEXT,
    "sourceBatch" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerListEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerListEntry_customerId_key" ON "public"."CustomerListEntry"("customerId");

-- CreateIndex
CREATE INDEX "CustomerListEntry_accountServiceManager_idx" ON "public"."CustomerListEntry"("accountServiceManager");

-- CreateIndex
CREATE INDEX "CustomerListEntry_industry_idx" ON "public"."CustomerListEntry"("industry");

-- CreateIndex
CREATE INDEX "CustomerListEntry_customerType_idx" ON "public"."CustomerListEntry"("customerType");

-- CreateIndex
CREATE INDEX "CustomerListEntry_customerStage_idx" ON "public"."CustomerListEntry"("customerStage");

-- AddForeignKey
ALTER TABLE "public"."CustomerListEntry"
ADD CONSTRAINT "CustomerListEntry_customerId_fkey"
FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
