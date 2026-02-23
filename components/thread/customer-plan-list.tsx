import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { StageStatusBadge } from "@/components/shared/stage-status-badge";
import { Button } from "@/components/ui/button";

type ScenarioItem = {
  id: string;
  customerId?: string | null;
  keyProjectScenario: string;
  keyPerson: string;
  keyPersonDept?: string | null;
  ownerName: string;
  stageStatus: "IN_PROGRESS" | "BLOCKED" | "DONE";
  updatedAt: Date;
  orgSection?: unknown;
};

type CustomerGroup = {
  customerId?: string | null;
  customerName: string;
  updatedAt: Date;
  scenarios: ScenarioItem[];
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
        return (
          <section key={`${group.customerId || "legacy"}-${group.customerName}`} className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
              <div>
                <h3 className="text-base font-semibold">{group.customerName}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>关键场景数：{group.scenarios.length}</span>
                <span>关键人数：{keyPeopleCount}</span>
                <span>最近更新：{format(group.updatedAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
              </div>
            </div>
            <div className="space-y-2 p-3">
              {group.scenarios.map((scenario) => {
                const people = extractKeyPeople(scenario);
                const detailHref = scenario.customerId
                  ? `/threads/customers/${scenario.customerId}?${new URLSearchParams({
                      scenarioId: scenario.id,
                      ...(managerName ? { managerName } : {}),
                      ...(role ? { role } : {}),
                    }).toString()}`
                  : `/threads/${scenario.id}`;
                return (
                  <div key={scenario.id} className="rounded-md border bg-background px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">关键场景：{scenario.keyProjectScenario}</div>
                      <div className="flex items-center gap-2">
                        <StageStatusBadge stageStatus={scenario.stageStatus} />
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={detailHref}>查看详情</Link>
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {people.map((person) => (
                        <span key={`${scenario.id}-${person}`} className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">
                          {person}
                        </span>
                      ))}
                      <span className="rounded-full border bg-muted/40 px-2 py-0.5 text-xs">负责人：{scenario.ownerName}</span>
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
