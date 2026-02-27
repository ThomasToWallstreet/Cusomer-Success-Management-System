-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."CustomerGoalWeeklySnapshot" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "revenueRate" DOUBLE PRECISION NOT NULL,
  "orgRate" DOUBLE PRECISION NOT NULL,
  "valueRate" DOUBLE PRECISION NOT NULL,
  "scenarioCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerGoalWeeklySnapshot_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CustomerGoalWeeklySnapshot_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CustomerGoalWeeklySnapshot_customerId_weekStart_key"
  ON "public"."CustomerGoalWeeklySnapshot"("customerId", "weekStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerGoalWeeklySnapshot_weekStart_idx"
  ON "public"."CustomerGoalWeeklySnapshot"("weekStart");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CustomerGoalWeeklySnapshot_customerId_weekStart_idx"
  ON "public"."CustomerGoalWeeklySnapshot"("customerId", "weekStart");
