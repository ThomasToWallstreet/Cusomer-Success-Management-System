export type GoalKey = "BUSINESS_GROWTH" | "ORG_BREAKTHROUGH" | "VALUE_REALIZATION";

export type ActivityStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export type RegionalActivity = {
  id: string;
  title: string;
  clarifiedAt: string;
  expectedCloseAt: string;
  planStart: string;
  deadline: string;
  monitorAt: string;
  status: ActivityStatus;
  note: string;
};

export type HeadquartersActivity = RegionalActivity & {
  activityKey: string;
  selected: boolean;
};

export type GoalPlan = {
  goalKey: GoalKey;
  goalLabel: string;
  headquartersActivities: HeadquartersActivity[];
  regionalActivities: RegionalActivity[];
};

export const GOAL_OPTIONS: Array<{ key: GoalKey; label: string }> = [
  { key: "BUSINESS_GROWTH", label: "经营目标-扩大收入" },
  { key: "ORG_BREAKTHROUGH", label: "客户成功-组织关系" },
  { key: "VALUE_REALIZATION", label: "客户成功-价值兑现" },
];

export const HQ_ACTIVITY_OPTIONS = [
  { key: "ATX", label: "ATX" },
  { key: "DELIVERY_VALUE", label: "交付标准落地" },
  { key: "SATISFACTION_RECOVERY", label: "满意度修复" },
  { key: "MOT_CONFIRMATION", label: "MOT" },
] as const;

export const STATUS_OPTIONS: Array<{ value: ActivityStatus; label: string }> = [
  { value: "TODO", label: "待执行" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "DONE", label: "已完成" },
  { value: "BLOCKED", label: "阻塞" },
];

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function safeStatus(value: unknown): ActivityStatus {
  if (value === "TODO" || value === "IN_PROGRESS" || value === "DONE" || value === "BLOCKED") return value;
  return "TODO";
}

export function makeActivityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

export function nowTimestampIso() {
  return new Date().toISOString();
}

export function emptyRegionalActivity(prefix: string): RegionalActivity {
  return {
    id: makeActivityId(prefix),
    title: "",
    clarifiedAt: "",
    expectedCloseAt: "",
    planStart: "",
    deadline: "",
    monitorAt: "",
    status: "TODO",
    note: "",
  };
}

function toRegionalActivity(raw: Record<string, unknown>, fallbackId: string): RegionalActivity {
  return {
    id: toText(raw.id) || fallbackId,
    title: toText(raw.title),
    clarifiedAt: toText(raw.clarifiedAt),
    expectedCloseAt: toText(raw.expectedCloseAt),
    planStart: toText(raw.planStart),
    deadline: toText(raw.deadline),
    monitorAt: toText(raw.monitorAt),
    status: safeStatus(raw.status),
    note: toText(raw.note),
  };
}

function defaultHeadquartersActivities(goalKey: GoalKey): HeadquartersActivity[] {
  return HQ_ACTIVITY_OPTIONS.map((item) => ({
    activityKey: item.key,
    selected: false,
    ...emptyRegionalActivity(`${goalKey}-${item.key}`),
    title: item.label,
  }));
}

export function normalizeGoals(executionSection: unknown): GoalPlan[] {
  const execution = toRecord(executionSection);
  const rawGoals = toArray(execution.goals);

  return GOAL_OPTIONS.map((goal, index) => {
    const matched = rawGoals.find((item) => toText(item.goalKey) === goal.key) || rawGoals[index] || {};
    const rawHeadquarters = toArray(matched.headquartersActivities);
    const rawRegional = toArray(matched.regionalActivities);

    const headquartersActivities = defaultHeadquartersActivities(goal.key).map((base, hqIndex) => {
      const raw =
        rawHeadquarters.find((item) => toText(item.activityKey) === base.activityKey) ||
        rawHeadquarters[hqIndex] ||
        {};
      const normalized = toRegionalActivity(raw, `${goal.key}-${base.activityKey}-${hqIndex + 1}`);
      return {
        ...base,
        ...normalized,
        title: toText(raw.title) || base.title,
        selected: Boolean(raw.selected),
      };
    });

    const regionalActivities = rawRegional.map((item, regionalIndex) =>
      toRegionalActivity(item, `${goal.key}-regional-${regionalIndex + 1}`),
    );

    return {
      goalKey: goal.key,
      goalLabel: toText(matched.goalLabel) || goal.label,
      headquartersActivities,
      regionalActivities,
    };
  });
}

export function hasRegionalContent(activity: RegionalActivity) {
  return Boolean(
    activity.title ||
      activity.planStart ||
      activity.deadline ||
      activity.monitorAt ||
      activity.note ||
      activity.expectedCloseAt ||
      activity.clarifiedAt ||
      activity.status !== "TODO",
  );
}

export function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setHours(0, 0, 0, 0);
  next.setDate(next.getDate() + diff);
  return next;
}

export function addWeeks(date: Date, weeks: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

export function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDateKey(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map((item) => Number(item));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function weekKeyOfPlanStart(value: string) {
  const date = parseDateKey(value);
  if (!date) return "";
  return toDateKey(startOfWeek(date));
}

export function formatWeekRange(weekStartKey: string) {
  const start = parseDateKey(weekStartKey);
  if (!start) return "";
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit", timeZone: "Asia/Shanghai" });
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

export function filterRegionalByWeek(goal: GoalPlan, weekKey: string) {
  const currentWeekKey = toDateKey(startOfWeek(new Date()));
  return goal.regionalActivities.filter((item) => {
    if (!item.planStart) return weekKey === currentWeekKey;
    return weekKeyOfPlanStart(item.planStart) === weekKey;
  });
}
