"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, Loader2, Pencil, Trash2 } from "lucide-react";

import { updateThreadSectionAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type ActivityStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

type RegionalActivity = {
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

type HeadquartersActivity = RegionalActivity & {
  activityKey: string;
  selected: boolean;
};

type GoalPlan = {
  goalKey: string;
  goalLabel: string;
  headquartersActivities: HeadquartersActivity[];
  regionalActivities: RegionalActivity[];
};

const GOAL_OPTIONS = [
  { key: "BUSINESS_GROWTH", label: "经营目标-扩大收入" },
  { key: "ORG_BREAKTHROUGH", label: "客户成功-组织关系" },
  { key: "VALUE_REALIZATION", label: "客户成功-价值兑现" },
] as const;

const HQ_ACTIVITY_OPTIONS = [
  { key: "ATX", label: "ATX" },
  { key: "KICKOFF", label: "项目启动会" },
  { key: "DELIVERY_VALUE", label: "交付标准落地并兑现价值（安全/云）" },
  { key: "SATISFACTION_RECOVERY", label: "满意度修复并恢复合作信心" },
  { key: "MOT_CONFIRMATION", label: "MOT年度服务目标确认" },
] as const;

const STATUS_OPTIONS: Array<{ value: ActivityStatus; label: string }> = [
  { value: "TODO", label: "待执行" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "DONE", label: "已完成" },
  { value: "BLOCKED", label: "阻塞" },
];

function safeStatus(value: unknown): ActivityStatus {
  if (value === "TODO" || value === "IN_PROGRESS" || value === "DONE" || value === "BLOCKED") return value;
  return "TODO";
}

function makeActivityId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function nowTimestampIso() {
  return new Date().toISOString();
}

function formatClarifiedAt(value: string) {
  if (!value) return "自动记录";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("zh-CN", {
    hour12: false,
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function emptyRegionalActivity(prefix: string): RegionalActivity {
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

function defaultHeadquartersActivities(goalKey: string): HeadquartersActivity[] {
  return HQ_ACTIVITY_OPTIONS.map((item) => ({
    activityKey: item.key,
    selected: false,
    ...emptyRegionalActivity(`${goalKey}-${item.key}`),
    title: item.label,
  }));
}

function mapLegacyItemsToRegional(
  executionItems: Array<Record<string, unknown>>,
  goalLabel: string,
  goalKey: string,
): RegionalActivity[] {
  return executionItems
    .filter((item) => {
      const linkedGoal = toText(item.linkedGoal);
      return linkedGoal === goalLabel;
    })
    .map((item, index) =>
      {
        const normalized = toRegionalActivity(item, `${goalKey}-legacy-${index + 1}`);
        return {
          ...normalized,
          clarifiedAt: normalized.clarifiedAt || nowTimestampIso(),
        };
      },
    )
    .filter(
      (item) =>
        item.title ||
        item.planStart ||
        item.deadline ||
        item.monitorAt ||
        item.note ||
        item.expectedCloseAt ||
        item.clarifiedAt ||
        item.status !== "TODO",
    );
}

function buildDefaultGoals(execution: Record<string, unknown>): GoalPlan[] {
  const legacyItems = toArray(execution.executionItems);
  return GOAL_OPTIONS.map((goal) => ({
    goalKey: goal.key,
    goalLabel: goal.label,
    headquartersActivities: defaultHeadquartersActivities(goal.key),
    regionalActivities: mapLegacyItemsToRegional(legacyItems, goal.label, goal.key),
  }));
}

function normalizeGoals(execution: Record<string, unknown>): GoalPlan[] {
  const rawGoals = toArray(execution.goals);
  if (!rawGoals.length) return buildDefaultGoals(execution);

  return GOAL_OPTIONS.map((goal, goalIndex) => {
    const matched = rawGoals.find((item) => toText(item.goalKey) === goal.key) || rawGoals[goalIndex] || {};
    const rawHeadquarters = toArray(matched.headquartersActivities);
    const headquartersActivities = HQ_ACTIVITY_OPTIONS.map((option, idx) => {
      const raw = rawHeadquarters.find((item) => toText(item.activityKey) === option.key) || rawHeadquarters[idx] || {};
      const base = toRegionalActivity(raw, `${goal.key}-${option.key}-${idx + 1}`);
      const selected = Boolean(raw.selected);
      return {
        ...base,
        clarifiedAt: selected ? base.clarifiedAt || nowTimestampIso() : base.clarifiedAt,
        title: toText(raw.title) || option.label,
        activityKey: option.key,
        selected,
      };
    });

    const regionalActivities = toArray(matched.regionalActivities).map((item, idx) => {
      const normalized = toRegionalActivity(item, `${goal.key}-regional-${idx + 1}`);
      return {
        ...normalized,
        clarifiedAt: normalized.clarifiedAt || nowTimestampIso(),
      };
    });

    return {
      goalKey: goal.key,
      goalLabel: toText(matched.goalLabel) || goal.label,
      headquartersActivities,
      regionalActivities,
    };
  });
}

function hasRegionalContent(activity: RegionalActivity) {
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

function getSubmittedHeadquarters(goal: GoalPlan) {
  return goal.headquartersActivities.filter((item) => item.selected);
}

function getSubmittedRegional(goal: GoalPlan) {
  return goal.regionalActivities.filter((item) => hasRegionalContent(item));
}

function ExecutionSaveButton({ savedAction }: { savedAction: string | null }) {
  const { pending } = useFormStatus();
  const isSaved = savedAction === "save_execution";
  return (
    <Button
      type="submit"
      className="h-8 cursor-pointer text-sm leading-snug"
      name="submitAction"
      value="save_execution"
      disabled={pending || isSaved}
    >
      {pending ? (
        <>
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          保存中…
        </>
      ) : isSaved ? (
        <>
          <Check className="mr-1.5 h-4 w-4" />
          已保存
        </>
      ) : (
        "保存"
      )}
    </Button>
  );
}

export function ExecutionWorkbench({
  threadId,
  executionSection,
  showSavedDialog = false,
  embedded = false,
  inputName = "executionSectionJson",
  goalKeyFilter,
}: {
  threadId: string;
  executionSection: unknown;
  showSavedDialog?: boolean;
  embedded?: boolean;
  inputName?: string;
  goalKeyFilter?: "BUSINESS_GROWTH" | "ORG_BREAKTHROUGH" | "VALUE_REALIZATION";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const managerName = embedded ? "" : searchParams.get("managerName") || "";
  const role = embedded ? "" : searchParams.get("role") || "";
  const execution = toRecord(executionSection);
  const initialGoals = normalizeGoals(execution).filter((goal) => !goalKeyFilter || goal.goalKey === goalKeyFilter);
  const [goals, setGoals] = useState<GoalPlan[]>(initialGoals);
  const [expandedGoalKey, setExpandedGoalKey] = useState<string>("");
  const [expandedSectionType, setExpandedSectionType] = useState<"headquarters" | "regional" | null>(null);
  const [expandedHeadquartersGoalKey, setExpandedHeadquartersGoalKey] = useState<string>("");
  const [expandedHeadquartersActivityId, setExpandedHeadquartersActivityId] = useState<Record<string, string | null>>({}); // activityKey or "new"
  const [newHeadquartersDraft, setNewHeadquartersDraft] = useState<
    Record<string, { activityKey: string; planStart: string; status: ActivityStatus; note: string } | null>
  >({});
  const [expandedRegionalActivityId, setExpandedRegionalActivityId] = useState<Record<string, string | null>>({});
  const savedAction = embedded ? "" : searchParams.get("savedAction") || "";
  const savedGoalKey = embedded ? "" : searchParams.get("savedGoalKey") || "";
  void showSavedDialog;

  const updateGoal = (goalKey: string, updater: (goal: GoalPlan) => GoalPlan) => {
    setGoals((prev) => prev.map((goal) => (goal.goalKey === goalKey ? updater(goal) : goal)));
  };

  const serializedSectionJson = JSON.stringify({ goals });
  const redirectTo = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "execution");
    params.set("mode", "view");
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (embedded) return;
    if (!savedAction) return;
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      params.delete("savedAction");
      params.delete("savedGoalKey");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [pathname, router, savedAction, searchParams]);

  const content = (
    <div className="space-y-3">
        <input type="hidden" name="id" value={threadId} />
        <input type="hidden" name={embedded ? inputName : "sectionJson"} value={serializedSectionJson} />
        {!embedded ? <input type="hidden" name="section" value="executionSection" /> : null}
        {!embedded ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
        {!embedded ? <input type="hidden" name="changedBy" value={managerName || role || "unknown"} /> : null}

        {goals.map((goal) => {
          const expanded = expandedGoalKey === goal.goalKey;
          const submittedHeadquarters = getSubmittedHeadquarters(goal);
          const submittedRegional = getSubmittedRegional(goal);
          return (
            <Card key={goal.goalKey} className="gap-3 py-2.5">
              <CardHeader className="py-2 px-4">
                <div className="flex w-full items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-snug">{goal.goalLabel}</CardTitle>
                  <div className="flex flex-col items-end text-xs leading-snug text-muted-foreground">
                    <span>总部定义关键活动：已提交 {submittedHeadquarters.length} 条</span>
                    <span>区域日常工作：已提交 {submittedRegional.length} 条</span>
                  </div>
                </div>
              </CardHeader>

              {expanded ? (
                <CardContent className="space-y-3 pt-0 px-4 pb-4">
                  {expandedSectionType === "headquarters" ? (
                  <section className="space-y-2 rounded-md border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug">总部定义关键活动</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 cursor-pointer text-sm leading-snug"
                        disabled={
                          goal.headquartersActivities.filter((a) => a.selected).length >= HQ_ACTIVITY_OPTIONS.length
                        }
                        onClick={() => {
                          const available = HQ_ACTIVITY_OPTIONS.filter(
                            (opt) => !goal.headquartersActivities.some((a) => a.activityKey === opt.key && a.selected),
                          );
                          if (available.length === 0) return;
                          setExpandedHeadquartersActivityId((prev) => ({ ...prev, [goal.goalKey]: "new" }));
                          setNewHeadquartersDraft((prev) => ({
                            ...prev,
                            [goal.goalKey]: {
                              activityKey: available[0].key,
                              planStart: "",
                              status: "TODO",
                              note: "",
                            },
                          }));
                        }}
                      >
                        新增
                      </Button>
                    </div>

                    {expandedHeadquartersActivityId[goal.goalKey] === "new" ? (
                      <div className="rounded-md border bg-muted/10 p-2.5">
                        <div className="grid gap-1.5 md:grid-cols-3">
                          <div className="space-y-0.5 md:col-span-2">
                            <p className="text-xs leading-snug text-muted-foreground">关键活动</p>
                            <select
                              className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                              value={newHeadquartersDraft[goal.goalKey]?.activityKey ?? ""}
                              onChange={(event) => {
                                const key = event.target.value;
                                setNewHeadquartersDraft((prev) => {
                                  const cur = prev[goal.goalKey];
                                  return { ...prev, [goal.goalKey]: cur ? { ...cur, activityKey: key } : { activityKey: key, planStart: "", status: "TODO" as ActivityStatus, note: "" } };
                                });
                              }}
                            >
                              {HQ_ACTIVITY_OPTIONS.filter((opt) =>
                                !goal.headquartersActivities.some((a) => a.activityKey === opt.key && a.selected),
                              ).map((opt) => (
                                <option key={opt.key} value={opt.key}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs leading-snug text-muted-foreground">关键活动明确时间</p>
                            <div className="flex h-8 items-center rounded-md border bg-muted px-2.5 text-sm leading-snug text-muted-foreground">
                              {formatClarifiedAt(nowTimestampIso())}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs leading-snug text-muted-foreground">预计开展时间</p>
                            <input
                              className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                              type="date"
                              aria-label="预计开展时间"
                              value={newHeadquartersDraft[goal.goalKey]?.planStart ?? ""}
                              onChange={(event) =>
                                setNewHeadquartersDraft((prev) => {
                                  const cur = prev[goal.goalKey];
                                  return { ...prev, [goal.goalKey]: cur ? { ...cur, planStart: event.target.value } : { activityKey: "", planStart: event.target.value, status: "TODO", note: "" } };
                                })
                              }
                            />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-xs leading-snug text-muted-foreground">状态</p>
                            <select
                              className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                              value={newHeadquartersDraft[goal.goalKey]?.status ?? "TODO"}
                              onChange={(event) =>
                                setNewHeadquartersDraft((prev) => {
                                  const cur = prev[goal.goalKey];
                                  return { ...prev, [goal.goalKey]: cur ? { ...cur, status: safeStatus(event.target.value) } : { activityKey: "", planStart: "", status: safeStatus(event.target.value), note: "" } };
                                })
                              }
                            >
                              {STATUS_OPTIONS.map((item) => (
                                <option key={item.value} value={item.value}>
                                  {item.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Textarea
                            rows={2}
                            className="text-sm leading-snug md:col-span-2"
                            placeholder="活动计划说明"
                            value={newHeadquartersDraft[goal.goalKey]?.note ?? ""}
                            onChange={(event) =>
                              setNewHeadquartersDraft((prev) => {
                                const cur = prev[goal.goalKey];
                                return { ...prev, [goal.goalKey]: cur ? { ...cur, note: event.target.value } : { activityKey: "", planStart: "", status: "TODO", note: event.target.value } };
                              })
                            }
                          />
                        </div>
                        <div className="mt-1.5 flex justify-end">
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            className="h-8 cursor-pointer text-sm leading-snug"
                            onClick={() => {
                              const draft = newHeadquartersDraft[goal.goalKey];
                              if (!draft?.activityKey) return;
                              updateGoal(goal.goalKey, (targetGoal) => ({
                                ...targetGoal,
                                headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                  item.activityKey === draft.activityKey
                                    ? {
                                        ...item,
                                        selected: true,
                                        clarifiedAt: item.clarifiedAt || nowTimestampIso(),
                                        planStart: draft.planStart,
                                        status: draft.status,
                                        note: draft.note,
                                      }
                                    : item,
                                ),
                              }));
                              setNewHeadquartersDraft((prev) => ({ ...prev, [goal.goalKey]: null }));
                              setExpandedHeadquartersActivityId((prev) => ({ ...prev, [goal.goalKey]: null }));
                            }}
                          >
                            确认
                          </Button>
                        </div>
                      </div>
                    ) : null}

                    {goal.headquartersActivities.filter((a) => a.selected).length ? (
                      <div className="space-y-2">
                        {goal.headquartersActivities
                          .filter((a) => a.selected)
                          .map((activity) => {
                            const isExpanded = expandedHeadquartersActivityId[goal.goalKey] === activity.activityKey;
                            return (
                              <div key={activity.activityKey} className="rounded-md border bg-muted/10 p-2.5">
                                {isExpanded ? (
                                  <>
                                    <div className="grid gap-1.5 md:grid-cols-3">
                                      <div className="space-y-0.5 md:col-span-2">
                                        <p className="text-xs leading-snug text-muted-foreground">关键活动</p>
                                        <div className="flex h-8 items-center rounded-md border bg-muted px-2.5 text-sm leading-snug">
                                          {activity.title}
                                        </div>
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="text-xs leading-snug text-muted-foreground">关键活动明确时间</p>
                                        <div className="flex h-8 items-center rounded-md border bg-muted px-2.5 text-sm leading-snug text-muted-foreground">
                                          {formatClarifiedAt(activity.clarifiedAt)}
                                        </div>
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="text-xs leading-snug text-muted-foreground">预计开展时间</p>
                                        <input
                                          className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                                          type="date"
                                          aria-label="预计开展时间"
                                          value={activity.planStart}
                                          onChange={(event) => {
                                            updateGoal(goal.goalKey, (targetGoal) => ({
                                              ...targetGoal,
                                              headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                                item.activityKey === activity.activityKey ? { ...item, planStart: event.target.value } : item,
                                              ),
                                            }));
                                          }}
                                        />
                                      </div>
                                      <div className="space-y-0.5">
                                        <p className="text-xs leading-snug text-muted-foreground">状态</p>
                                        <select
                                          className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                                          value={activity.status}
                                          onChange={(event) => {
                                            updateGoal(goal.goalKey, (targetGoal) => ({
                                              ...targetGoal,
                                              headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                                item.activityKey === activity.activityKey
                                                  ? { ...item, status: safeStatus(event.target.value) }
                                                  : item,
                                              ),
                                            }));
                                          }}
                                        >
                                          {STATUS_OPTIONS.map((item) => (
                                            <option key={item.value} value={item.value}>
                                              {item.label}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                      <Textarea
                                        rows={2}
                                        className="text-sm leading-snug md:col-span-2"
                                        placeholder="活动计划说明"
                                        value={activity.note}
                                        onChange={(event) => {
                                          updateGoal(goal.goalKey, (targetGoal) => ({
                                            ...targetGoal,
                                            headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                              item.activityKey === activity.activityKey ? { ...item, note: event.target.value } : item,
                                            ),
                                          }));
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7 shrink-0"
                                        aria-label={`删除${activity.title}`}
                                        onClick={() => {
                                          updateGoal(goal.goalKey, (targetGoal) => ({
                                            ...targetGoal,
                                            headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                              item.activityKey === activity.activityKey ? { ...item, selected: false } : item,
                                            ),
                                          }));
                                          setExpandedHeadquartersActivityId((prev) =>
                                            prev[goal.goalKey] === activity.activityKey ? { ...prev, [goal.goalKey]: null } : prev,
                                          );
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                    <div className="mt-1.5 flex justify-end">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="default"
                                        className="h-8 cursor-pointer text-sm leading-snug"
                                        onClick={() =>
                                          setExpandedHeadquartersActivityId((prev) => ({ ...prev, [goal.goalKey]: null }))
                                        }
                                      >
                                        确认
                                      </Button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium leading-snug">{activity.title}</p>
                                      <p className="text-xs leading-snug text-muted-foreground">
                                        状态：{STATUS_OPTIONS.find((s) => s.value === activity.status)?.label || "待执行"} ·
                                        预计开展：{activity.planStart || "-"}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        aria-label={`编辑${activity.title}`}
                                        onClick={() =>
                                          setExpandedHeadquartersActivityId((prev) => ({ ...prev, [goal.goalKey]: activity.activityKey }))
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        aria-label={`删除总部关键活动${activity.title}`}
                                        onClick={() => {
                                          updateGoal(goal.goalKey, (targetGoal) => ({
                                            ...targetGoal,
                                            headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                              item.activityKey === activity.activityKey ? { ...item, selected: false } : item,
                                            ),
                                          }));
                                          setExpandedHeadquartersActivityId((prev) =>
                                            prev[goal.goalKey] === activity.activityKey ? { ...prev, [goal.goalKey]: null } : prev,
                                          );
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    ) : expandedHeadquartersActivityId[goal.goalKey] !== "new" ? (
                      <p className="text-xs leading-snug text-muted-foreground">暂无总部关键活动，请点击右侧「新增」。</p>
                    ) : null}
                    <div className="flex justify-end pt-0.5">
                      <span className="inline-flex rounded-md border bg-muted/30 px-2.5 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto cursor-pointer p-0 text-xs leading-snug text-muted-foreground hover:bg-transparent"
                          onClick={() => setExpandedSectionType(null)}
                        >
                          返回
                        </Button>
                      </span>
                    </div>
                  </section>
                  ) : (
                  <section className="rounded-md border p-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold leading-snug">总部定义关键活动</h4>
                        <span className="text-xs leading-snug text-muted-foreground">{submittedHeadquarters.length} 项</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs leading-snug"
                        onClick={() => {
                          setExpandedSectionType("headquarters");
                          setExpandedHeadquartersGoalKey(goal.goalKey);
                        }}
                      >
                        编辑
                      </Button>
                    </div>
                    {submittedHeadquarters.length ? (
                      <div className="space-y-2">
                        {submittedHeadquarters.map((item) => (
                          <div key={item.activityKey} className="rounded-md border bg-muted/20 p-2 text-sm leading-snug">
                            <p className="font-medium leading-snug">{item.title}</p>
                            <p className="text-xs leading-snug text-muted-foreground">
                              状态：{STATUS_OPTIONS.find((s) => s.value === item.status)?.label || "待执行"} ·
                              预计开展：{item.planStart || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-snug text-muted-foreground">暂无已提交关键活动。</p>
                    )}
                  </section>
                  )}

                  {expandedSectionType === "regional" ? (
                  <section className="space-y-2 rounded-md border p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold leading-snug">区域日常工作</h4>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 cursor-pointer text-sm leading-snug"
                        onClick={() => {
                          const newActivity = {
                            ...emptyRegionalActivity(`${goal.goalKey}-regional`),
                            clarifiedAt: nowTimestampIso(),
                          };
                          updateGoal(goal.goalKey, (targetGoal) => ({
                            ...targetGoal,
                            regionalActivities: [...targetGoal.regionalActivities, newActivity],
                          }));
                          setExpandedRegionalActivityId((prev) => ({ ...prev, [goal.goalKey]: newActivity.id }));
                        }}
                      >
                        新增
                      </Button>
                    </div>

                    {goal.regionalActivities.length ? (
                      <div className="space-y-2">
                        {goal.regionalActivities.map((activity) => {
                          const isExpanded = expandedRegionalActivityId[goal.goalKey] === activity.id;
                          return (
                            <div key={activity.id} className="rounded-md border bg-muted/10 p-2.5">
                              {isExpanded ? (
                                <>
                                  <div className="grid gap-1.5 md:grid-cols-3">
                                    <input
                                      className="h-8 rounded-md border bg-background px-2.5 text-sm leading-snug md:col-span-2"
                                      placeholder="关键活动标题"
                                      value={activity.title}
                                      onChange={(event) => {
                                        updateGoal(goal.goalKey, (targetGoal) => ({
                                          ...targetGoal,
                                          regionalActivities: targetGoal.regionalActivities.map((item) =>
                                            item.id === activity.id ? { ...item, title: event.target.value } : item,
                                          ),
                                        }));
                                      }}
                                    />
                                    <div className="space-y-0.5">
                                      <p className="text-xs leading-snug text-muted-foreground">关键活动明确时间</p>
                                      <div className="flex h-8 items-center rounded-md border bg-muted px-2.5 text-sm leading-snug text-muted-foreground">
                                        {formatClarifiedAt(activity.clarifiedAt)}
                                      </div>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-xs leading-snug text-muted-foreground">预计开展时间</p>
                                      <input
                                        className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                                        type="date"
                                        aria-label="预计开展时间"
                                        value={activity.planStart}
                                        onChange={(event) => {
                                          updateGoal(goal.goalKey, (targetGoal) => ({
                                            ...targetGoal,
                                            regionalActivities: targetGoal.regionalActivities.map((item) =>
                                              item.id === activity.id ? { ...item, planStart: event.target.value } : item,
                                            ),
                                          }));
                                        }}
                                      />
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-xs leading-snug text-muted-foreground">状态</p>
                                      <select
                                        className="h-8 w-full rounded-md border bg-background px-2.5 text-sm leading-snug"
                                        value={activity.status}
                                        onChange={(event) => {
                                          updateGoal(goal.goalKey, (targetGoal) => ({
                                            ...targetGoal,
                                            regionalActivities: targetGoal.regionalActivities.map((item) =>
                                              item.id === activity.id
                                                ? { ...item, status: safeStatus(event.target.value) }
                                                : item,
                                            ),
                                          }));
                                        }}
                                      >
                                        {STATUS_OPTIONS.map((item) => (
                                          <option key={item.value} value={item.value}>
                                            {item.label}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <Textarea
                                      rows={2}
                                      className="text-sm leading-snug md:col-span-2"
                                      placeholder="活动计划说明"
                                      value={activity.note}
                                      onChange={(event) => {
                                        updateGoal(goal.goalKey, (targetGoal) => ({
                                          ...targetGoal,
                                          regionalActivities: targetGoal.regionalActivities.map((item) =>
                                            item.id === activity.id ? { ...item, note: event.target.value } : item,
                                          ),
                                        }));
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7 shrink-0"
                                      aria-label={`删除区域日常工作${activity.title || "未命名区域活动"}`}
                                      onClick={() => {
                                        updateGoal(goal.goalKey, (targetGoal) => ({
                                          ...targetGoal,
                                          regionalActivities: targetGoal.regionalActivities.filter(
                                            (item) => item.id !== activity.id,
                                          ),
                                        }));
                                        setExpandedRegionalActivityId((prev) =>
                                          prev[goal.goalKey] === activity.id ? { ...prev, [goal.goalKey]: null } : prev,
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                  <div className="mt-1.5 flex justify-end">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="default"
                                      className="h-8 cursor-pointer text-sm leading-snug"
                                      onClick={() =>
                                        setExpandedRegionalActivityId((prev) => ({ ...prev, [goal.goalKey]: null }))
                                      }
                                    >
                                      确认
                                    </Button>
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium leading-snug">{activity.title || "未命名区域活动"}</p>
                                    <p className="text-xs leading-snug text-muted-foreground">
                                      状态：{STATUS_OPTIONS.find((s) => s.value === activity.status)?.label || "待执行"} ·
                                      预计开展：{activity.planStart || "-"}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      aria-label={`编辑${activity.title || "未命名区域活动"}`}
                                      onClick={() =>
                                        setExpandedRegionalActivityId((prev) => ({ ...prev, [goal.goalKey]: activity.id }))
                                      }
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-7 w-7"
                                      aria-label={`删除区域日常工作${activity.title || "未命名区域活动"}`}
                                      onClick={() => {
                                        updateGoal(goal.goalKey, (targetGoal) => ({
                                          ...targetGoal,
                                          regionalActivities: targetGoal.regionalActivities.filter(
                                            (item) => item.id !== activity.id,
                                          ),
                                        }));
                                        setExpandedRegionalActivityId((prev) =>
                                          prev[goal.goalKey] === activity.id ? { ...prev, [goal.goalKey]: null } : prev,
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs leading-snug text-muted-foreground">暂无区域日常工作，请点击右侧「新增」。</p>
                    )}
                    <div className="flex justify-end pt-0.5">
                      <span className="inline-flex rounded-md border bg-muted/30 px-2.5 py-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto cursor-pointer p-0 text-xs leading-snug text-muted-foreground hover:bg-transparent"
                          onClick={() => setExpandedSectionType(null)}
                        >
                          返回
                        </Button>
                      </span>
                    </div>
                  </section>
                  ) : (
                  <section className="rounded-md border p-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold leading-snug">区域日常工作</h4>
                        <span className="text-xs leading-snug text-muted-foreground">{submittedRegional.length} 项</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs leading-snug"
                        onClick={() => {
                          setExpandedSectionType("regional");
                          setExpandedHeadquartersGoalKey("");
                        }}
                      >
                        编辑
                      </Button>
                    </div>
                    {submittedRegional.length ? (
                      <div className="space-y-2">
                        {submittedRegional.map((item) => (
                          <div key={item.id} className="rounded-md border bg-muted/20 p-2 text-sm leading-snug">
                            <p className="font-medium leading-snug">{item.title || "未命名区域活动"}</p>
                            <p className="text-xs leading-snug text-muted-foreground">
                              状态：{STATUS_OPTIONS.find((s) => s.value === item.status)?.label || "待执行"} ·
                              预计开展：{item.planStart || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-snug text-muted-foreground">暂无已提交区域工作。</p>
                    )}
                  </section>
                  )}
                </CardContent>
              ) : null}

              {!expanded ? (
                <CardContent className="space-y-3 pt-0 px-4 pb-4">
                  <section className="rounded-md border p-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold leading-snug">总部定义关键活动</h4>
                        <span className="text-xs leading-snug text-muted-foreground">{submittedHeadquarters.length} 项</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs leading-snug"
                        onClick={() => {
                          setExpandedGoalKey(goal.goalKey);
                          setExpandedSectionType("headquarters");
                          setExpandedHeadquartersGoalKey(goal.goalKey);
                        }}
                      >
                        编辑
                      </Button>
                    </div>
                    {submittedHeadquarters.length ? (
                      <div className="space-y-2">
                        {submittedHeadquarters.map((item) => (
                          <div key={item.activityKey} className="rounded-md border bg-muted/20 p-2 text-sm leading-snug">
                            <p className="font-medium leading-snug">{item.title}</p>
                            <p className="text-xs leading-snug text-muted-foreground">
                              状态：{STATUS_OPTIONS.find((status) => status.value === item.status)?.label || "待执行"} ·
                              预计开展：{item.planStart || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-snug text-muted-foreground">暂无已提交关键活动。</p>
                    )}
                  </section>

                  <section className="rounded-md border p-2.5">
                    <div className="mb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold leading-snug">区域日常工作</h4>
                        <span className="text-xs leading-snug text-muted-foreground">{submittedRegional.length} 项</span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs leading-snug"
                        onClick={() => {
                          setExpandedGoalKey(goal.goalKey);
                          setExpandedSectionType("regional");
                          setExpandedHeadquartersGoalKey("");
                        }}
                      >
                        编辑
                      </Button>
                    </div>
                    {submittedRegional.length ? (
                      <div className="space-y-2">
                        {submittedRegional.map((item) => (
                          <div key={item.id} className="rounded-md border bg-muted/20 p-2 text-sm leading-snug">
                            <p className="font-medium leading-snug">{item.title || "未命名区域活动"}</p>
                            <p className="text-xs leading-snug text-muted-foreground">
                              状态：{STATUS_OPTIONS.find((status) => status.value === item.status)?.label || "待执行"} ·
                              预计开展：{item.planStart || "-"}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs leading-snug text-muted-foreground">暂无已提交区域工作。</p>
                    )}
                  </section>

                </CardContent>
              ) : null}
            </Card>
          );
        })}

        {!embedded ? (
          <div className="flex justify-end pt-1">
            <ExecutionSaveButton savedAction={savedAction} />
          </div>
        ) : null}
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <form action={updateThreadSectionAction} className="space-y-3">
      {content}
    </form>
  );
}
