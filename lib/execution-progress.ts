type ActivityStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type ExecutionGoal = {
  goalLabel: string;
  headquartersActivities: Array<Record<string, unknown>>;
  regionalActivities: Array<Record<string, unknown>>;
};

export type ExecutionActivitySummary = {
  threadId: string;
  customerName: string;
  scenarioName: string;
  ownerName: string;
  goalLabel: string;
  source: "HEADQUARTERS" | "REGIONAL";
  itemTitle: string;
  status: ActivityStatus;
  closedAt: string;
  note: string;
};

export type ThreadExecutionSummary = {
  hasRecord: boolean;
  totalCount: number;
  headquartersCount: number;
  regionalCount: number;
  doneCount: number;
  lastClosedAt: string;
  items: ExecutionActivitySummary[];
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStatus(value: unknown): ActivityStatus {
  if (value === "TODO" || value === "IN_PROGRESS" || value === "DONE" || value === "BLOCKED") {
    return value;
  }
  return "TODO";
}

function hasRegionalContent(activity: Record<string, unknown>) {
  const status = toStatus(activity.status);
  return Boolean(
    toText(activity.title) ||
      toText(activity.planStart) ||
      toText(activity.expectedCloseAt) ||
      toText(activity.deadline) ||
      toText(activity.monitorAt) ||
      toText(activity.clarifiedAt) ||
      toText(activity.note) ||
      status !== "TODO",
  );
}

function pickClosedAt(activity: Record<string, unknown>) {
  return (
    toText(activity.expectedCloseAt) ||
    toText(activity.deadline) ||
    toText(activity.monitorAt) ||
    toText(activity.planStart) ||
    toText(activity.clarifiedAt)
  );
}

function toTimestamp(value: string) {
  if (!value) return 0;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function normalizeExecutionGoals(executionSection: unknown): ExecutionGoal[] {
  const execution = toRecord(executionSection);
  const rawGoals = toArray(execution.goals);
  return rawGoals.map((item, index) => ({
    goalLabel: toText(item.goalLabel) || `目标${index + 1}`,
    headquartersActivities: toArray(item.headquartersActivities),
    regionalActivities: toArray(item.regionalActivities),
  }));
}

export function buildThreadExecutionSummary(input: {
  threadId: string;
  customerName: string;
  scenarioName: string;
  ownerName: string;
  executionSection: unknown;
}): ThreadExecutionSummary {
  const goals = normalizeExecutionGoals(input.executionSection);
  const items: ExecutionActivitySummary[] = [];
  let headquartersCount = 0;
  let regionalCount = 0;

  goals.forEach((goal) => {
    goal.headquartersActivities.forEach((activity) => {
      if (!Boolean(activity.selected)) return;
      headquartersCount += 1;
      items.push({
        threadId: input.threadId,
        customerName: input.customerName,
        scenarioName: input.scenarioName,
        ownerName: input.ownerName,
        goalLabel: goal.goalLabel,
        source: "HEADQUARTERS",
        itemTitle: toText(activity.title) || "总部关键活动",
        status: toStatus(activity.status),
        closedAt: pickClosedAt(activity),
        note: toText(activity.note),
      });
    });

    goal.regionalActivities.forEach((activity) => {
      if (!hasRegionalContent(activity)) return;
      regionalCount += 1;
      items.push({
        threadId: input.threadId,
        customerName: input.customerName,
        scenarioName: input.scenarioName,
        ownerName: input.ownerName,
        goalLabel: goal.goalLabel,
        source: "REGIONAL",
        itemTitle: toText(activity.title) || "区域日常工作",
        status: toStatus(activity.status),
        closedAt: pickClosedAt(activity),
        note: toText(activity.note),
      });
    });
  });

  const sortedItems = [...items].sort((a, b) => toTimestamp(b.closedAt) - toTimestamp(a.closedAt));
  const doneCount = sortedItems.filter((item) => item.status === "DONE").length;
  return {
    hasRecord: sortedItems.length > 0,
    totalCount: sortedItems.length,
    headquartersCount,
    regionalCount,
    doneCount,
    lastClosedAt: sortedItems[0]?.closedAt || "",
    items: sortedItems,
  };
}

export function hasExecutionRecord(executionSection: unknown) {
  return buildThreadExecutionSummary({
    threadId: "",
    customerName: "",
    scenarioName: "",
    ownerName: "",
    executionSection,
  }).hasRecord;
}
