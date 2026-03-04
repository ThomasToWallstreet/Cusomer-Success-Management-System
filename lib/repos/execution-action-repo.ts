import { Prisma, type ExecutionActionStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

type ExecutionActionUpsertInput = {
  threadId: string;
  externalKey: string;
  goalKey: string;
  sourceType: "HEADQUARTERS" | "REGIONAL";
  title: string;
  ownerName: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  planStartAt?: Date | null;
  deadlineAt?: Date | null;
  closedAt?: Date | null;
  note?: string | null;
};

export async function listExecutionActionsByThreadIds(threadIds: string[]) {
  if (!threadIds.length) return [];
  return prisma.executionAction.findMany({
    where: { threadId: { in: threadIds }, isArchived: false },
    orderBy: [{ deadlineAt: "asc" }, { updatedAt: "desc" }],
  });
}

export async function getExecutionActionsByThreadId(threadId: string) {
  return prisma.executionAction.findMany({
    where: { threadId },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function upsertExecutionAction(input: ExecutionActionUpsertInput) {
  return prisma.executionAction.upsert({
    where: {
      threadId_externalKey: {
        threadId: input.threadId,
        externalKey: input.externalKey,
      },
    },
    create: {
      ...input,
      note: input.note || null,
      planStartAt: input.planStartAt || null,
      deadlineAt: input.deadlineAt || null,
      closedAt: input.closedAt || null,
      isArchived: false,
    },
    update: {
      goalKey: input.goalKey,
      sourceType: input.sourceType,
      title: input.title,
      ownerName: input.ownerName,
      status: input.status,
      planStartAt: input.planStartAt || null,
      deadlineAt: input.deadlineAt || null,
      closedAt: input.closedAt || null,
      note: input.note || null,
      isArchived: false,
    },
  });
}

export async function archiveExecutionActionsByExternalKeys(threadId: string, activeKeys: string[]) {
  return prisma.executionAction.updateMany({
    where: {
      threadId,
      externalKey: { notIn: activeKeys },
      isArchived: false,
    },
    data: {
      isArchived: true,
    },
  });
}

export async function createExecutionActionEvent(input: {
  actionId: string;
  eventType: "CREATED" | "STATUS_CHANGED" | "DEADLINE_CHANGED" | "NOTE_UPDATED" | "UPDATED" | "ARCHIVED";
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
  changedBy?: string;
  source?: "UI_EXECUTION" | "UI_WEEKLY_QUICK" | "SYSTEM_SYNC";
}) {
  return prisma.executionActionEvent.create({
    data: {
      actionId: input.actionId,
      eventType: input.eventType,
      beforeValue: input.beforeValue ? (input.beforeValue as Prisma.InputJsonValue) : Prisma.JsonNull,
      afterValue: input.afterValue ? (input.afterValue as Prisma.InputJsonValue) : Prisma.JsonNull,
      changedBy: input.changedBy || null,
      source: input.source || "UI_EXECUTION",
    },
  });
}

export async function updateExecutionActionStatus(actionId: string, status: "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED") {
  return prisma.executionAction.update({
    where: { id: actionId },
    data: {
      status,
      closedAt: status === "DONE" ? new Date() : null,
      isArchived: false,
    },
  });
}

export async function captureWeeklyReportActionSnapshot(weeklyReportId: string, threadIds: string[]) {
  const actions = await listExecutionActionsByThreadIds(threadIds);
  if (!actions.length) return { createdCount: 0 };
  await prisma.weeklyReportActionSnapshot.createMany({
    data: actions.map((action) => ({
      weeklyReportId,
      actionId: action.id,
      baselineStatus: action.status,
      baselineDeadlineAt: action.deadlineAt,
      baselineClosedAt: action.closedAt,
    })),
    skipDuplicates: true,
  });
  return { createdCount: actions.length };
}

export async function listWeeklyReportActionDiff(weeklyReportId: string) {
  const snapshots = await prisma.weeklyReportActionSnapshot.findMany({
    where: { weeklyReportId },
    include: { action: true },
  });
  return snapshots.map((item) => ({
    actionId: item.actionId,
    title: item.action.title,
    ownerName: item.action.ownerName,
    baselineStatus: item.baselineStatus,
    currentStatus: item.action.status,
    baselineDeadlineAt: item.baselineDeadlineAt,
    currentDeadlineAt: item.action.deadlineAt,
    baselineClosedAt: item.baselineClosedAt,
    currentClosedAt: item.action.closedAt,
  }));
}

export async function getExecutionQuarterYearMetrics() {
  const now = new Date();
  const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [quarterEvents, yearEvents, overdueActions, closedActions] = await Promise.all([
    prisma.executionActionEvent.findMany({
      where: { changedAt: { gte: quarterStart } },
      select: { eventType: true, changedAt: true },
    }),
    prisma.executionActionEvent.findMany({
      where: { changedAt: { gte: yearStart } },
      select: { eventType: true, changedAt: true },
    }),
    prisma.executionAction.count({
      where: {
        isArchived: false,
        deadlineAt: { lt: now },
        status: { not: "DONE" as ExecutionActionStatus },
      },
    }),
    prisma.executionAction.findMany({
      where: {
        isArchived: false,
        closedAt: { not: null },
      },
      select: { createdAt: true, closedAt: true },
    }),
  ]);

  const quarterDone = quarterEvents.filter((item) => item.eventType === "STATUS_CHANGED").length;
  const yearDone = yearEvents.filter((item) => item.eventType === "STATUS_CHANGED").length;
  const quarterBlocked = quarterEvents.filter((item) => item.eventType === "ARCHIVED").length;
  const yearBlocked = yearEvents.filter((item) => item.eventType === "ARCHIVED").length;
  const totalClosedHours = closedActions.reduce((sum, row) => {
    if (!row.closedAt) return sum;
    return sum + Math.max(0, row.closedAt.getTime() - row.createdAt.getTime()) / (1000 * 60 * 60);
  }, 0);
  const avgCloseHours = closedActions.length ? Math.round((totalClosedHours / closedActions.length) * 10) / 10 : 0;

  return {
    quarter: {
      eventCount: quarterEvents.length,
      statusChangeCount: quarterDone,
      archivedCount: quarterBlocked,
    },
    year: {
      eventCount: yearEvents.length,
      statusChangeCount: yearDone,
      archivedCount: yearBlocked,
    },
    overdueActionCount: overdueActions,
    avgCloseHours,
  };
}
