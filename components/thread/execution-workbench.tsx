"use client";

import { useState } from "react";

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
  owner: string;
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
  { key: "ORG_BREAKTHROUGH", label: "客户成功目标-组织关系突破" },
  { key: "VALUE_REALIZATION", label: "客户成功目标-需求理解" },
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

function emptyRegionalActivity(prefix: string): RegionalActivity {
  return {
    id: makeActivityId(prefix),
    title: "",
    owner: "",
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
    owner: toText(raw.owner),
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
      toRegionalActivity(item, `${goalKey}-legacy-${index + 1}`),
    )
    .filter((item) => item.title || item.owner || item.deadline || item.note);
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
      return {
        ...base,
        title: toText(raw.title) || option.label,
        activityKey: option.key,
        selected: Boolean(raw.selected),
      };
    });

    const regionalActivities = toArray(matched.regionalActivities).map((item, idx) =>
      toRegionalActivity(item, `${goal.key}-regional-${idx + 1}`),
    );

    return {
      goalKey: goal.key,
      goalLabel: toText(matched.goalLabel) || goal.label,
      headquartersActivities,
      regionalActivities,
    };
  });
}

export function ExecutionWorkbench({
  threadId,
  activitySection: _activitySection,
  executionSection,
}: {
  threadId: string;
  activitySection: unknown;
  executionSection: unknown;
}) {
  const execution = toRecord(executionSection);
  const initialGoals = normalizeGoals(execution);
  const [goals, setGoals] = useState<GoalPlan[]>(initialGoals);
  const [expandedGoalKey, setExpandedGoalKey] = useState<string>(initialGoals[0]?.goalKey || GOAL_OPTIONS[0].key);

  const updateGoal = (goalKey: string, updater: (goal: GoalPlan) => GoalPlan) => {
    setGoals((prev) => prev.map((goal) => (goal.goalKey === goalKey ? updater(goal) : goal)));
  };

  const serializedSectionJson = JSON.stringify({
    ...execution,
    goals,
  });

  return (
    <form action={updateThreadSectionAction} className="space-y-3">
      <input type="hidden" name="id" value={threadId} />
      <input type="hidden" name="section" value="executionSection" />
      <input type="hidden" name="sectionJson" value={serializedSectionJson} />

      {goals.map((goal) => {
        const expanded = expandedGoalKey === goal.goalKey;
        return (
          <Card key={goal.goalKey}>
            <CardHeader className="py-3">
              <button
                type="button"
                onClick={() => setExpandedGoalKey((prev) => (prev === goal.goalKey ? "" : goal.goalKey))}
                className="flex w-full cursor-pointer items-center justify-between text-left"
              >
                <CardTitle className="text-base">{goal.goalLabel}</CardTitle>
                <span className="text-xs text-muted-foreground">
                  总部活动 {goal.headquartersActivities.filter((item) => item.selected).length}/5 · 区域 {goal.regionalActivities.length}
                </span>
              </button>
            </CardHeader>

            {expanded ? (
              <CardContent className="space-y-4">
                <section className="space-y-2 rounded-md border p-3">
                  <h4 className="text-sm font-semibold">总部定义关键活动</h4>
                  <div className="space-y-3">
                    {goal.headquartersActivities.map((activity) => (
                      <div key={activity.activityKey} className="rounded-md border bg-muted/10 p-3">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={activity.selected}
                            onChange={(event) => {
                              updateGoal(goal.goalKey, (targetGoal) => ({
                                ...targetGoal,
                                headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                  item.activityKey === activity.activityKey
                                    ? { ...item, selected: event.target.checked }
                                    : item,
                                ),
                              }));
                            }}
                          />
                          {activity.title}
                        </label>

                        {activity.selected ? (
                          <div className="mt-2 grid gap-2 md:grid-cols-3">
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              placeholder="负责人"
                              value={activity.owner}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                    item.activityKey === activity.activityKey ? { ...item, owner: event.target.value } : item,
                                  ),
                                }));
                              }}
                            />
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              type="date"
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
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              type="date"
                              value={activity.deadline}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                    item.activityKey === activity.activityKey ? { ...item, deadline: event.target.value } : item,
                                  ),
                                }));
                              }}
                            />
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              type="date"
                              value={activity.monitorAt}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  headquartersActivities: targetGoal.headquartersActivities.map((item) =>
                                    item.activityKey === activity.activityKey ? { ...item, monitorAt: event.target.value } : item,
                                  ),
                                }));
                              }}
                            />
                            <select
                              className="h-9 rounded-md border bg-background px-3 text-sm"
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
                            <Textarea
                              rows={2}
                              className="md:col-span-3"
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
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-2 rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold">区域日常工作</h4>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => {
                        updateGoal(goal.goalKey, (targetGoal) => ({
                          ...targetGoal,
                          regionalActivities: [...targetGoal.regionalActivities, emptyRegionalActivity(`${goal.goalKey}-regional`)],
                        }));
                      }}
                    >
                      新增条目
                    </Button>
                  </div>

                  {goal.regionalActivities.length ? (
                    <div className="space-y-3">
                      {goal.regionalActivities.map((activity) => (
                        <div key={activity.id} className="rounded-md border bg-muted/10 p-3">
                          <div className="grid gap-2 md:grid-cols-3">
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm md:col-span-2"
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
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              placeholder="负责人"
                              value={activity.owner}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  regionalActivities: targetGoal.regionalActivities.map((item) =>
                                    item.id === activity.id ? { ...item, owner: event.target.value } : item,
                                  ),
                                }));
                              }}
                            />
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              type="date"
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
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              type="date"
                              value={activity.deadline}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  regionalActivities: targetGoal.regionalActivities.map((item) =>
                                    item.id === activity.id ? { ...item, deadline: event.target.value } : item,
                                  ),
                                }));
                              }}
                            />
                            <input
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              type="date"
                              value={activity.monitorAt}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  regionalActivities: targetGoal.regionalActivities.map((item) =>
                                    item.id === activity.id ? { ...item, monitorAt: event.target.value } : item,
                                  ),
                                }));
                              }}
                            />
                            <select
                              className="h-9 rounded-md border bg-background px-3 text-sm"
                              value={activity.status}
                              onChange={(event) => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  regionalActivities: targetGoal.regionalActivities.map((item) =>
                                    item.id === activity.id ? { ...item, status: safeStatus(event.target.value) } : item,
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
                            <Textarea
                              rows={2}
                              className="md:col-span-2"
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
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => {
                                updateGoal(goal.goalKey, (targetGoal) => ({
                                  ...targetGoal,
                                  regionalActivities: targetGoal.regionalActivities.filter((item) => item.id !== activity.id),
                                }));
                              }}
                            >
                              删除条目
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">暂无区域日常工作，请点击“新增条目”。</p>
                  )}
                </section>
              </CardContent>
            ) : null}
          </Card>
        );
      })}

      <div className="flex justify-end">
        <Button type="submit" className="cursor-pointer">
          保存执行推进
        </Button>
      </div>
    </form>
  );
}
