"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GOAL_OPTIONS,
  addWeeks,
  filterRegionalByWeek,
  formatWeekRange,
  hasRegionalContent,
  normalizeGoals,
  startOfWeek,
  toDateKey,
} from "@/components/thread/execution-section-utils";

type Props = {
  executionSection: unknown;
};

type WorkItem = {
  id: string;
  goalKey: string;
  goalLabel: string;
  itemType: "总部定义关键活动" | "区域日常工作";
  title: string;
  planStart: string;
  status: string;
  note: string;
};

const STATUS_TEXT: Record<string, string> = {
  TODO: "待执行",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
  BLOCKED: "阻塞",
};

export function PlanProgressModule({ executionSection }: Props) {
  const goals = useMemo(() => normalizeGoals(executionSection), [executionSection]);
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0);
  const [expandedRowId, setExpandedRowId] = useState<string>("");

  const selectedWeekKey = useMemo(
    () => toDateKey(startOfWeek(addWeeks(new Date(), selectedWeekOffset))),
    [selectedWeekOffset],
  );

  const groupedItems = useMemo(() => {
    const map = new Map<string, WorkItem[]>();

    for (const goal of goals) {
      const hqItems: WorkItem[] = goal.headquartersActivities
        .filter((item) => item.selected)
        .filter((item) => {
          if (!item.planStart) return selectedWeekOffset === 0;
          const week = toDateKey(startOfWeek(new Date(item.planStart)));
          return week === selectedWeekKey;
        })
        .map((item) => ({
          id: `${goal.goalKey}-hq-${item.activityKey}`,
          goalKey: goal.goalKey,
          goalLabel: goal.goalLabel,
          itemType: "总部定义关键活动",
          title: item.title || "未命名活动",
          planStart: item.planStart || "-",
          status: STATUS_TEXT[item.status] || "待执行",
          note: item.note || "-",
        }));

      const regionalItems: WorkItem[] = filterRegionalByWeek(goal, selectedWeekKey)
        .filter((item) => hasRegionalContent(item))
        .map((item) => ({
          id: `${goal.goalKey}-regional-${item.id}`,
          goalKey: goal.goalKey,
          goalLabel: goal.goalLabel,
          itemType: "区域日常工作",
          title: item.title || "未命名活动",
          planStart: item.planStart || "-",
          status: STATUS_TEXT[item.status] || "待执行",
          note: item.note || "-",
        }));

      map.set(goal.goalKey, [...hqItems, ...regionalItems]);
    }

    return map;
  }, [goals, selectedWeekKey, selectedWeekOffset]);

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden">
        <CardHeader className="py-3">
          <CardTitle className="text-sm">具体工作进度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/20 p-2.5">
            <p className="text-sm font-medium">
              {selectedWeekOffset === 0 ? "本周" : selectedWeekOffset < 0 ? `${Math.abs(selectedWeekOffset)}周前` : `${selectedWeekOffset}周后`}（{formatWeekRange(selectedWeekKey)}）
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => setSelectedWeekOffset((prev) => prev - 1)}>
                上一周
              </Button>
              <Button type="button" size="sm" variant={selectedWeekOffset === 0 ? "secondary" : "outline"} className="h-7 px-2" onClick={() => setSelectedWeekOffset(0)}>
                本周
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-7 px-2" onClick={() => setSelectedWeekOffset((prev) => prev + 1)}>
                下一周
              </Button>
            </div>
          </div>

          {GOAL_OPTIONS.map((goal) => {
            const rows = groupedItems.get(goal.key) || [];
            return (
              <section key={goal.key} className="space-y-2 rounded-md border p-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">{goal.label}</h4>
                  <span className="text-xs text-muted-foreground">{rows.length} 项</span>
                </div>
                <div className="overflow-hidden rounded-md border">
                  <div className="max-h-[320px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-muted/40 text-xs text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 font-medium">事项</th>
                          <th className="px-3 py-2 font-medium">类型</th>
                          <th className="px-3 py-2 font-medium">预计开始时间</th>
                          <th className="px-3 py-2 font-medium">状态</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.length ? (
                          rows.map((row) => {
                            const expanded = expandedRowId === row.id;
                            return (
                              <tr
                                key={row.id}
                                className="cursor-pointer border-t hover:bg-muted/20"
                                onClick={() => setExpandedRowId((prev) => (prev === row.id ? "" : row.id))}
                              >
                                <td className="px-3 py-2 align-top">
                                  <p className="font-medium">{row.title}</p>
                                  {expanded ? <p className="mt-1 text-xs text-muted-foreground">{row.note}</p> : null}
                                </td>
                                <td className="px-3 py-2 align-top">{row.itemType}</td>
                                <td className="px-3 py-2 align-top">{row.planStart}</td>
                                <td className="px-3 py-2 align-top">{row.status}</td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td className="px-3 py-3 text-xs text-muted-foreground" colSpan={4}>
                              当前周暂无具体工作
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
