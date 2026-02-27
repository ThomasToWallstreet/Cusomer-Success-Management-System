import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Trash2 } from "lucide-react";

import { deleteThreadAction } from "@/app/(dashboard)/threads/actions";
import { GoalProgressPanel, GoalTrendMini } from "@/components/thread/goal-progress-panel";
import { StageStatusBadge } from "@/components/shared/stage-status-badge";
import { Button } from "@/components/ui/button";
import { getScenarioBusinessStageLabel, getScenarioGoalProgress } from "@/lib/thread-goal-progress";

type ScenarioItem = {
  id: string;
  customerId?: string | null;
  keyProjectScenario: string;
  keyPerson: string;
  keyPersonDept?: string | null;
  ownerName: string;
  stageStatus: "IN_PROGRESS" | "BLOCKED" | "DONE";
  updatedAt: Date;
  goalSection?: unknown;
  orgSection?: unknown;
  successSection?: unknown;
};

type CustomerGroup = {
  customerId?: string | null;
  customerName: string;
  updatedAt: Date;
  scenarios: ScenarioItem[];
  goalProgress: {
    revenueRate: number;
    orgRate: number;
    valueRate: number;
    sampleSize: number;
  };
  trend?: {
    revenueDelta: number;
    orgDelta: number;
    valueDelta: number;
    weeks: number;
    points: Array<{
      weekStart: Date;
      revenueRate: number;
      orgRate: number;
      valueRate: number;
    }>;
  };
};

function extractKeyPeople(item: ScenarioItem) {
  const people: string[] = [];
  if (item.orgSection && typeof item.orgSection === "object") {
    const section = item.orgSection as { stakeholders?: Array<{ name?: string; department?: string; level?: string }> };
    if (Array.isArray(section.stakeholders)) {
      for (const row of section.stakeholders) {
        if (!row?.name) continue;
        const suffix = [row.department, row.level].filter(Boolean).join("/");
        people.push(suffix ? `${row.name}（${suffix}）` : row.name);
      }
    }
  }
  if (!people.length && item.keyPerson) {
    const fallback = [item.keyPersonDept].filter(Boolean).join("/");
    people.push(fallback ? `${item.keyPerson}（${fallback}）` : item.keyPerson);
  }
  return people;
}

export function CustomerPlanList({
  groups,
  managerName,
  role,
}: {
  groups: CustomerGroup[];
  managerName?: string;
  role?: string;
}) {
  if (!groups.length) {
    return <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">暂无符合条件的客户成功计划</div>;
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const keyPeopleCount = group.scenarios.reduce((count, scenario) => {
          return count + extractKeyPeople(scenario).length;
        }, 0);
        const customerDetailHref =
          group.customerId && group.scenarios.length
            ? `/threads/customers/${group.customerId}?${new URLSearchParams({
                scenarioId: group.scenarios[0].id,
                ...(managerName ? { managerName } : {}),
                ...(role ? { role } : {}),
              }).toString()}`
            : undefined;
        return (
          <section key={`${group.customerId || "legacy"}-${group.customerName}`} className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h3 className="text-base font-semibold">{group.customerName}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span>关键场景数：{group.scenarios.length}</span>
                  <span>关键人数：{keyPeopleCount}</span>
                  <span>最近更新：{format(group.updatedAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
                </div>
                {customerDetailHref ? (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={customerDetailHref}>进入关键场景详情</Link>
                  </Button>
                ) : null}
              </div>
            </div>
            <div className="space-y-2 p-3">
              <div className="grid items-stretch gap-2 lg:grid-cols-2">
                <div className="h-full">
                  <GoalProgressPanel
                    compact
                    items={[
                      { label: "经营目标-扩大收入", ratio: group.goalProgress.revenueRate },
                      { label: "客户成功-组织关系突破", ratio: group.goalProgress.orgRate },
                      { label: "客户成功-价值兑现", ratio: group.goalProgress.valueRate },
                    ]}
                    sampleSize={group.goalProgress.sampleSize}
                  />
                </div>
                <div className="h-full">
                  {group.trend ? (
                    <GoalTrendMini title="近4周变化趋势" points={group.trend.points} />
                  ) : (
                    <div className="flex h-full items-center rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                      近4周变化趋势暂无数据
                    </div>
                  )}
                </div>
              </div>
              {group.scenarios.map((scenario) => {
                const people = extractKeyPeople(scenario);
                const scenarioProgress = getScenarioGoalProgress(scenario);
                const scenarioBusinessStageLabel = getScenarioBusinessStageLabel(scenario);
                return (
                  <div key={scenario.id} className="rounded-md border bg-background p-3">
                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium">关键场景：{scenario.keyProjectScenario}</div>
                          <div className="flex items-center gap-2">
                            <StageStatusBadge stageStatus={scenario.stageStatus} />
                            {role === "supervisor" ? (
                              <form action={deleteThreadAction}>
                                <input type="hidden" name="id" value={scenario.id} />
                                <input type="hidden" name="role" value={role} />
                                <input type="hidden" name="customerId" value={group.customerId || ""} />
                                <Button type="submit" variant="ghost" size="icon" aria-label="删除客户成功计划">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </form>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {people.map((person) => (
                            <span key={`${scenario.id}-${person}`} className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
                              {person}
                            </span>
                          ))}
                          <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">负责人：{scenario.ownerName}</span>
                          <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
                            三目标完成：{scenarioProgress.doneCount}/{scenarioProgress.totalCount}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center lg:justify-end">
                        <span className="inline-flex items-center gap-2 rounded-full border bg-sky-50 px-3 py-1 text-xs text-sky-700">
                          <span className="h-2 w-2 rounded-full bg-sky-500" />
                          当前业务流阶段：{scenarioBusinessStageLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
