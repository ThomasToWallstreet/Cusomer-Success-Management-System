import { type ExecutionAction } from "@prisma/client";

import {
  archiveExecutionActionsByExternalKeys,
  createExecutionActionEvent,
  getExecutionActionsByThreadId,
  upsertExecutionAction,
} from "@/lib/repos/execution-action-repo";

type ActionStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type NormalizedExecutionAction = {
  externalKey: string;
  goalKey: string;
  sourceType: "HEADQUARTERS" | "REGIONAL";
  title: string;
  ownerName: string;
  status: ActionStatus;
  planStartAt?: Date | null;
  deadlineAt?: Date | null;
  closedAt?: Date | null;
  note?: string | null;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toStatus(value: unknown): ActionStatus {
  if (value === "TODO" || value === "IN_PROGRESS" || value === "DONE" || value === "BLOCKED") return value;
  return "TODO";
}

function toDate(value: unknown) {
  const text = toText(value);
  if (!text) return null;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? null : date;
}

function diffEventType(before: ExecutionAction | undefined, next: NormalizedExecutionAction) {
  if (!before) return "CREATED" as const;
  if (before.status !== next.status) return "STATUS_CHANGED" as const;
  const beforeDeadline = before.deadlineAt?.toISOString() || "";
  const afterDeadline = next.deadlineAt?.toISOString() || "";
  if (beforeDeadline !== afterDeadline) return "DEADLINE_CHANGED" as const;
  if ((before.note || "") !== (next.note || "")) return "NOTE_UPDATED" as const;
  return "UPDATED" as const;
}

export function normalizeExecutionActionsFromSection(input: {
  executionSection: unknown;
  threadId: string;
  ownerName: string;
}) {
  const execution = toRecord(input.executionSection);
  const goals = toArray(execution.goals);
  const actions: NormalizedExecutionAction[] = [];

  goals.forEach((goal, goalIdx) => {
    const goalKey = toText(goal.goalKey) || `GOAL_${goalIdx + 1}`;
    const headquarters = toArray(goal.headquartersActivities);
    headquarters.forEach((activity, idx) => {
      if (!Boolean(activity.selected)) return;
      const activityKey = toText(activity.activityKey) || toText(activity.id) || `${goalKey}-hq-${idx + 1}`;
      actions.push({
        externalKey: `${goalKey}:HEADQUARTERS:${activityKey}`,
        goalKey,
        sourceType: "HEADQUARTERS",
        title: toText(activity.title) || "总部关键活动",
        ownerName: toText(activity.ownerName) || input.ownerName,
        status: toStatus(activity.status),
        planStartAt: toDate(activity.planStart),
        deadlineAt: toDate(activity.deadline) || toDate(activity.expectedCloseAt) || toDate(activity.monitorAt),
        closedAt: toDate(activity.closedAt),
        note: toText(activity.note) || null,
      });
    });

    const regional = toArray(goal.regionalActivities);
    regional.forEach((activity, idx) => {
      const id = toText(activity.id) || `${goalKey}-rg-${idx + 1}`;
      const hasContent = Boolean(
        toText(activity.title) ||
          toText(activity.planStart) ||
          toText(activity.deadline) ||
          toText(activity.expectedCloseAt) ||
          toText(activity.monitorAt) ||
          toText(activity.note) ||
          toStatus(activity.status) !== "TODO",
      );
      if (!hasContent) return;
      actions.push({
        externalKey: `${goalKey}:REGIONAL:${id}`,
        goalKey,
        sourceType: "REGIONAL",
        title: toText(activity.title) || "区域日常工作",
        ownerName: toText(activity.ownerName) || input.ownerName,
        status: toStatus(activity.status),
        planStartAt: toDate(activity.planStart),
        deadlineAt: toDate(activity.deadline) || toDate(activity.expectedCloseAt) || toDate(activity.monitorAt),
        closedAt: toDate(activity.closedAt),
        note: toText(activity.note) || null,
      });
    });
  });

  return actions;
}

export async function syncExecutionActionsFromSection(input: {
  threadId: string;
  ownerName: string;
  executionSection: unknown;
  changedBy?: string;
  source?: "UI_EXECUTION" | "UI_WEEKLY_QUICK" | "SYSTEM_SYNC";
}) {
  const normalized = normalizeExecutionActionsFromSection(input);
  const existing = await getExecutionActionsByThreadId(input.threadId);
  const existingMap = new Map(existing.map((item) => [item.externalKey, item] as const));

  for (const item of normalized) {
    const before = existingMap.get(item.externalKey);
    const saved = await upsertExecutionAction({
      threadId: input.threadId,
      ...item,
    });
    const eventType = diffEventType(before, item);
    if (!before || eventType !== "UPDATED") {
      await createExecutionActionEvent({
        actionId: saved.id,
        eventType,
        beforeValue: before
          ? {
              status: before.status,
              deadlineAt: before.deadlineAt?.toISOString() || null,
              note: before.note || null,
            }
          : undefined,
        afterValue: {
          status: item.status,
          deadlineAt: item.deadlineAt?.toISOString() || null,
          note: item.note || null,
        },
        changedBy: input.changedBy,
        source: input.source || "UI_EXECUTION",
      });
    }
  }

  const activeKeys = normalized.map((item) => item.externalKey);
  const willArchive = existing.filter((item) => !item.isArchived && !activeKeys.includes(item.externalKey));
  const archived = await archiveExecutionActionsByExternalKeys(input.threadId, activeKeys);
  if (archived.count > 0) {
    for (const action of willArchive) {
      await createExecutionActionEvent({
        actionId: action.id,
        eventType: "ARCHIVED",
        beforeValue: { status: action.status },
        afterValue: { isArchived: true },
        changedBy: input.changedBy,
        source: input.source || "UI_EXECUTION",
      });
    }
  }
}
