-- AlterTable
ALTER TABLE "public"."WeeklyReport"
ADD COLUMN IF NOT EXISTS "weeklyObjectives" JSONB,
ADD COLUMN IF NOT EXISTS "plannedExecutionItems" JSONB,
ADD COLUMN IF NOT EXISTS "executedItems" JSONB,
ADD COLUMN IF NOT EXISTS "qualitativeConclusions" JSONB,
ADD COLUMN IF NOT EXISTS "satisfactionRiskLevel" TEXT,
ADD COLUMN IF NOT EXISTS "satisfactionRiskReason" TEXT,
ADD COLUMN IF NOT EXISTS "requiredNextActions" JSONB;
