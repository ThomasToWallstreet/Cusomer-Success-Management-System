-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."Stage" AS ENUM ('BASIC_INFO', 'BUSINESS_GOAL', 'ORG_RELATION', 'SUCCESS_DEFINITION', 'KEY_ACTIVITIES', 'EXECUTION');

-- CreateEnum
CREATE TYPE "public"."StageStatus" AS ENUM ('IN_PROGRESS', 'BLOCKED', 'DONE');

-- CreateEnum
CREATE TYPE "public"."RiskLevel" AS ENUM ('GREEN', 'YELLOW', 'RED');

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

-- CreateTable
CREATE TABLE "public"."KeySuccessScenario" (
    "id" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "customerId" TEXT,
    "keyPerson" TEXT NOT NULL,
    "keyPersonDept" TEXT,
    "keyProjectScenario" TEXT NOT NULL,
    "productLine" TEXT,
    "ownerName" TEXT NOT NULL,
    "stage" "public"."Stage" NOT NULL DEFAULT 'BASIC_INFO',
    "stageStatus" "public"."StageStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "riskLevel" "public"."RiskLevel" NOT NULL DEFAULT 'GREEN',
    "nextAction" TEXT,
    "goalSection" JSONB,
    "orgSection" JSONB,
    "successSection" JSONB,
    "activitySection" JSONB,
    "executionSection" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KeySuccessScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyReport" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "ownerName" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "risks" TEXT,
    "nextWeekPlan" TEXT,
    "needSupport" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyReportThread" (
    "id" TEXT NOT NULL,
    "weeklyReportId" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "WeeklyReportThread_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_name_key" ON "public"."Customer"("name");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_customer_idx" ON "public"."KeySuccessScenario"("customer");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_customerId_idx" ON "public"."KeySuccessScenario"("customerId");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_ownerName_idx" ON "public"."KeySuccessScenario"("ownerName");

-- CreateIndex
CREATE INDEX "KeySuccessScenario_riskLevel_stage_idx" ON "public"."KeySuccessScenario"("riskLevel", "stage");

-- CreateIndex
CREATE INDEX "WeeklyReport_ownerName_weekStart_idx" ON "public"."WeeklyReport"("ownerName", "weekStart");

-- CreateIndex
CREATE INDEX "WeeklyReport_customerId_weekStart_idx" ON "public"."WeeklyReport"("customerId", "weekStart");

-- CreateIndex
CREATE INDEX "WeeklyReportThread_threadId_idx" ON "public"."WeeklyReportThread"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReportThread_weeklyReportId_threadId_key" ON "public"."WeeklyReportThread"("weeklyReportId", "threadId");

-- AddForeignKey
ALTER TABLE "public"."KeySuccessScenario" ADD CONSTRAINT "KeySuccessScenario_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReport" ADD CONSTRAINT "WeeklyReport_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReportThread" ADD CONSTRAINT "WeeklyReportThread_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES "public"."WeeklyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReportThread" ADD CONSTRAINT "WeeklyReportThread_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."KeySuccessScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

