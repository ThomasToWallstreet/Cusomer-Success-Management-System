"use client";

import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { updateThreadSectionAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  GOAL_OPTIONS,
  HQ_ACTIVITY_OPTIONS,
  STATUS_OPTIONS,
  makeActivityId,
  normalizeGoals,
  nowTimestampIso,
  startOfWeek,
  toDateKey,
  type GoalKey,
} from "@/components/thread/execution-section-utils";

type ActivityType = "HEADQUARTERS" | "REGIONAL";

type Props = {
  threadId: string;
  executionSection: unknown;
  managerName?: string;
  role?: string;
};

function buildRedirectTo(pathname: string, managerName?: string, role?: string) {
  const params = new URLSearchParams({ tab: "activity-add" });
  if (managerName) params.set("managerName", managerName);
  if (role) params.set("role", role);
  return `${pathname}?${params.toString()}`;
}

export function ActivityAddModule({ threadId, executionSection, managerName, role }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const savedAction = searchParams.get("savedAction") || "";

  const [goals, setGoals] = useState(() => normalizeGoals(executionSection));
  const [goalKey, setGoalKey] = useState<GoalKey>("BUSINESS_GROWTH");
  const [activityType, setActivityType] = useState<ActivityType>("HEADQUARTERS");
  const [hqActivityKey, setHqActivityKey] = useState<(typeof HQ_ACTIVITY_OPTIONS)[number]["key"]>("ATX");
  const [regionalTitle, setRegionalTitle] = useState("");
  const [planStart, setPlanStart] = useState(toDateKey(startOfWeek(new Date())));
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]["value"]>("TODO");
  const [note, setNote] = useState("");

  const serializedSectionJson = JSON.stringify({ goals });
  const redirectTo = useMemo(() => buildRedirectTo(pathname, managerName, role), [pathname, managerName, role]);

  const goalLabelMap = useMemo(() => {
    const map = new Map<GoalKey, string>();
    GOAL_OPTIONS.forEach((item) => map.set(item.key, item.label));
    return map;
  }, []);

  const appendDraft = () => {
    if (activityType === "REGIONAL" && !regionalTitle.trim()) return;

    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.goalKey !== goalKey) return goal;

        if (activityType === "HEADQUARTERS") {
          return {
            ...goal,
            headquartersActivities: goal.headquartersActivities.map((item) =>
              item.activityKey === hqActivityKey
                ? {
                    ...item,
                    selected: true,
                    title: HQ_ACTIVITY_OPTIONS.find((opt) => opt.key === hqActivityKey)?.label || item.title,
                    clarifiedAt: nowTimestampIso(),
                    planStart,
                    status,
                    note,
                  }
                : item,
            ),
          };
        }

        return {
          ...goal,
          regionalActivities: [
            ...goal.regionalActivities,
            {
              id: makeActivityId(`${goalKey}-regional`),
              title: regionalTitle.trim(),
              clarifiedAt: nowTimestampIso(),
              expectedCloseAt: "",
              planStart,
              deadline: "",
              monitorAt: "",
              status,
              note,
            },
          ],
        };
      }),
    );

    if (activityType === "REGIONAL") setRegionalTitle("");
    setNote("");
    setStatus("TODO");
  };

  return (
    <div className="space-y-3">
      {savedAction === "save_execution" ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">保存成功，已停留在具体活动新增模块。</div>
      ) : null}

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">具体活动新增</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">承接目标</p>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={goalKey}
                onChange={(event) => setGoalKey(event.target.value as GoalKey)}
              >
                {GOAL_OPTIONS.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">活动类型</p>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={activityType}
                onChange={(event) => setActivityType(event.target.value as ActivityType)}
              >
                <option value="HEADQUARTERS">总部定义关键活动</option>
                <option value="REGIONAL">区域日常工作</option>
              </select>
            </div>

            {activityType === "HEADQUARTERS" ? (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">关键活动</p>
                <select
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={hqActivityKey}
                  onChange={(event) => setHqActivityKey(event.target.value as (typeof HQ_ACTIVITY_OPTIONS)[number]["key"])}
                >
                  {HQ_ACTIVITY_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <p className="text-xs text-muted-foreground">活动内容</p>
                <input
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                  value={regionalTitle}
                  onChange={(event) => setRegionalTitle(event.target.value)}
                  placeholder="请输入区域日常工作事项"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">预计开始时间</p>
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                type="date"
                value={planStart}
                onChange={(event) => setPlanStart(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">状态</p>
              <select
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(event) => setStatus(event.target.value as (typeof STATUS_OPTIONS)[number]["value"])}
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">活动计划说明</p>
            <Textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
          </div>

          <div className="flex justify-end">
            <Button type="button" size="sm" variant="outline" onClick={appendDraft}>
              加入待保存列表
            </Button>
          </div>

          <div className="rounded-md border bg-muted/20 p-2.5">
            <p className="mb-2 text-xs text-muted-foreground">当前待保存概览</p>
            <div className="space-y-1 text-sm">
              {goals.map((goal) => {
                const hqCount = goal.headquartersActivities.filter((item) => item.selected).length;
                const regionalCount = goal.regionalActivities.length;
                return (
                  <div key={goal.goalKey} className="flex items-center justify-between">
                    <span>{goalLabelMap.get(goal.goalKey) || goal.goalLabel}</span>
                    <span className="text-xs text-muted-foreground">
                      总部 {hqCount} / 区域 {regionalCount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <form action={updateThreadSectionAction} className="flex justify-end">
            <input type="hidden" name="id" value={threadId} />
            <input type="hidden" name="section" value="executionSection" />
            <input type="hidden" name="sectionJson" value={serializedSectionJson} />
            <input type="hidden" name="submitAction" value="save_execution" />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <input type="hidden" name="changedBy" value={managerName || role || "unknown"} />
            <Button type="submit" size="sm">
              保存活动定义
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
