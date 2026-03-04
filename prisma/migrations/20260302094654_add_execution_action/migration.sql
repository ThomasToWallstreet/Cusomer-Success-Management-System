-- CreateEnum
CREATE TYPE "public"."ExecutionSourceType" AS ENUM ('HEADQUARTERS', 'REGIONAL');

-- CreateEnum
CREATE TYPE "public"."ExecutionActionStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "public"."ExecutionActionEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'DEADLINE_CHANGED', 'NOTE_UPDATED', 'UPDATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ExecutionActionChangeSource" AS ENUM ('UI_EXECUTION', 'UI_WEEKLY_QUICK', 'SYSTEM_SYNC');

-- CreateTable
CREATE TABLE "public"."ExecutionAction" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "externalKey" TEXT NOT NULL,
    "goalKey" TEXT NOT NULL,
    "sourceType" "public"."ExecutionSourceType" NOT NULL,
    "title" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "status" "public"."ExecutionActionStatus" NOT NULL DEFAULT 'TODO',
    "planStartAt" TIMESTAMP(3),
    "deadlineAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "note" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExecutionAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExecutionActionEvent" (
    "id" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "eventType" "public"."ExecutionActionEventType" NOT NULL,
    "beforeValue" JSONB,
    "afterValue" JSONB,
    "changedBy" TEXT,
    "source" "public"."ExecutionActionChangeSource" NOT NULL DEFAULT 'UI_EXECUTION',
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionActionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WeeklyReportActionSnapshot" (
    "id" TEXT NOT NULL,
    "weeklyReportId" TEXT NOT NULL,
    "actionId" TEXT NOT NULL,
    "baselineStatus" "public"."ExecutionActionStatus" NOT NULL,
    "baselineDeadlineAt" TIMESTAMP(3),
    "baselineClosedAt" TIMESTAMP(3),
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyReportActionSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExecutionAction_threadId_status_idx" ON "public"."ExecutionAction"("threadId", "status");

-- CreateIndex
CREATE INDEX "ExecutionAction_threadId_deadlineAt_idx" ON "public"."ExecutionAction"("threadId", "deadlineAt");

-- CreateIndex
CREATE INDEX "ExecutionAction_goalKey_idx" ON "public"."ExecutionAction"("goalKey");

-- CreateIndex
CREATE UNIQUE INDEX "ExecutionAction_threadId_externalKey_key" ON "public"."ExecutionAction"("threadId", "externalKey");

-- CreateIndex
CREATE INDEX "ExecutionActionEvent_actionId_changedAt_idx" ON "public"."ExecutionActionEvent"("actionId", "changedAt");

-- CreateIndex
CREATE INDEX "ExecutionActionEvent_eventType_changedAt_idx" ON "public"."ExecutionActionEvent"("eventType", "changedAt");

-- CreateIndex
CREATE INDEX "WeeklyReportActionSnapshot_actionId_idx" ON "public"."WeeklyReportActionSnapshot"("actionId");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReportActionSnapshot_weeklyReportId_actionId_key" ON "public"."WeeklyReportActionSnapshot"("weeklyReportId", "actionId");

-- AddForeignKey
ALTER TABLE "public"."ExecutionAction" ADD CONSTRAINT "ExecutionAction_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."KeySuccessScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExecutionActionEvent" ADD CONSTRAINT "ExecutionActionEvent_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."ExecutionAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReportActionSnapshot" ADD CONSTRAINT "WeeklyReportActionSnapshot_weeklyReportId_fkey" FOREIGN KEY ("weeklyReportId") REFERENCES "public"."WeeklyReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WeeklyReportActionSnapshot" ADD CONSTRAINT "WeeklyReportActionSnapshot_actionId_fkey" FOREIGN KEY ("actionId") REFERENCES "public"."ExecutionAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
