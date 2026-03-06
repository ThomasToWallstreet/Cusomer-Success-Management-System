-- AlterTable
ALTER TABLE "public"."CustomerProjectItem"
ADD COLUMN "businessGoalUpdatedAt" TIMESTAMP(3),
ADD COLUMN "businessGoalEvidence" TEXT;

-- AlterTable
ALTER TABLE "public"."CustomerScenarioItem"
ADD COLUMN "alignedUpdatedAt" TIMESTAMP(3),
ADD COLUMN "alignedEvidence" TEXT;

-- CreateTable
CREATE TABLE "public"."CustomerProjectBusinessGoalHistory" (
  "id" TEXT NOT NULL,
  "projectItemId" TEXT NOT NULL,
  "businessGoalAchieved" TEXT NOT NULL,
  "businessGoalUpdatedAt" TIMESTAMP(3) NOT NULL,
  "businessGoalEvidence" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerProjectBusinessGoalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CustomerScenarioAlignmentHistory" (
  "id" TEXT NOT NULL,
  "scenarioItemId" TEXT NOT NULL,
  "alignedWithCustomer" TEXT NOT NULL,
  "alignedUpdatedAt" TIMESTAMP(3) NOT NULL,
  "alignedEvidence" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerScenarioAlignmentHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."CustomerProjectBusinessGoalHistory"
ADD CONSTRAINT "CustomerProjectBusinessGoalHistory_projectItemId_fkey"
FOREIGN KEY ("projectItemId") REFERENCES "public"."CustomerProjectItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CustomerScenarioAlignmentHistory"
ADD CONSTRAINT "CustomerScenarioAlignmentHistory_scenarioItemId_fkey"
FOREIGN KEY ("scenarioItemId") REFERENCES "public"."CustomerScenarioItem"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "CustomerProjectBusinessGoalHistory_projectItemId_businessGoalUpdatedAt_idx"
ON "public"."CustomerProjectBusinessGoalHistory"("projectItemId", "businessGoalUpdatedAt");

-- CreateIndex
CREATE INDEX "CustomerScenarioAlignmentHistory_scenarioItemId_alignedUpdatedAt_idx"
ON "public"."CustomerScenarioAlignmentHistory"("scenarioItemId", "alignedUpdatedAt");
