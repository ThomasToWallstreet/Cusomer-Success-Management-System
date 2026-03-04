-- CreateTable
CREATE TABLE "public"."CustomerProjectItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productLine" TEXT,
    "targetDimension" JSONB,
    "targetDescription" TEXT,
    "businessStage" TEXT,
    "businessGoalAchieved" TEXT,
    "keyScenarioDescription" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerProjectItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerScenarioItem" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "businessNeedAnalysis" TEXT,
    "personalNeeds" TEXT,
    "smartGoal" TEXT,
    "alignedWithCustomer" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerScenarioItem_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "public"."KeySuccessScenario"
ADD COLUMN "projectItemId" TEXT,
ADD COLUMN "contactId" TEXT,
ADD COLUMN "scenarioItemId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProjectItem_customerId_name_key" ON "public"."CustomerProjectItem"("customerId", "name");

-- CreateIndex
CREATE INDEX "CustomerProjectItem_customerId_idx" ON "public"."CustomerProjectItem"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerScenarioItem_customerId_name_key" ON "public"."CustomerScenarioItem"("customerId", "name");

-- CreateIndex
CREATE INDEX "CustomerScenarioItem_customerId_idx" ON "public"."CustomerScenarioItem"("customerId");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_projectItemId_idx" ON "public"."KeySuccessScenario"("projectItemId");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_contactId_idx" ON "public"."KeySuccessScenario"("contactId");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_scenarioItemId_idx" ON "public"."KeySuccessScenario"("scenarioItemId");

-- AddForeignKey
ALTER TABLE "public"."CustomerProjectItem" ADD CONSTRAINT "CustomerProjectItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerScenarioItem" ADD CONSTRAINT "CustomerScenarioItem_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KeySuccessScenario" ADD CONSTRAINT "KeySuccessScenario_projectItemId_fkey" FOREIGN KEY ("projectItemId") REFERENCES "public"."CustomerProjectItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KeySuccessScenario" ADD CONSTRAINT "KeySuccessScenario_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."CustomerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."KeySuccessScenario" ADD CONSTRAINT "KeySuccessScenario_scenarioItemId_fkey" FOREIGN KEY ("scenarioItemId") REFERENCES "public"."CustomerScenarioItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
