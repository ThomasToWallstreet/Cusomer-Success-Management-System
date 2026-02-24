import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { RiskBadge } from "@/components/shared/risk-badge";
import { StageStatusBadge } from "@/components/shared/stage-status-badge";
import { Button } from "@/components/ui/button";
import { getCustomerById } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager, resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
import { listThreads } from "@/lib/repos/thread-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function formatBooleanOrText(value: unknown, trueLabel = "是", falseLabel = "否") {
  if (value === true) return trueLabel;
  if (value === false) return falseLabel;
  if (typeof value === "string" && value.trim()) return value;
  return "-";
}

export default async function CustomerPlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { customerId } = await params;
  const query = await searchParams;
  const role = parseViewerRole(getOne(query.role));
  const managerNameQuery = getOne(query.managerName);
  const { managerName } = await resolveCurrentManager(managerNameQuery, {
    allowAll: isSupervisorRole(role),
  });
  const allowedCustomerIds = isSupervisorRole(role)
    ? undefined
    : await listCustomerIdsByManager(managerName === "ALL" ? undefined : managerName);
  if (allowedCustomerIds && !allowedCustomerIds.includes(customerId)) {
    notFound();
  }

  const customer = await getCustomerById(customerId);
  if (!customer) notFound();

  const scenarios = await listThreads({
    customerId,
    customerIds: allowedCustomerIds,
  });
  if (!scenarios.length) {
    notFound();
  }

  const selectedScenarioId = getOne(query.scenarioId) || scenarios[0].id;
  const selected = scenarios.find((item) => item.id === selectedScenarioId) || scenarios[0];

  const currentQuery = {
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  };

  const goal = toRecord(selected.goalSection);
  const org = toRecord(selected.orgSection);
  const success = toRecord(selected.successSection);
  const basic = toRecord(selected.activitySection);
  const stakeholders = Array.isArray(org.stakeholders) ? (org.stakeholders as Array<Record<string, unknown>>) : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">客户成功计划详情</h2>
        <Button variant="outline" asChild>
          <Link href={new URLSearchParams(currentQuery).toString() ? `/threads?${new URLSearchParams(currentQuery).toString()}` : "/threads"}>
            返回客户成功计划
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-5 text-sm">
          <span>客户名称：{customer.name}</span>
          <span>行业：{customer.industry || "-"}</span>
          <span>大客户服务经理：{managerName || "-"}</span>
          <span>最近更新：{format(selected.updatedAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
          <Button size="sm" asChild className="ml-auto">
            <Link
              href={`/threads/new?${new URLSearchParams({
                customerId: customerId,
                ...currentQuery,
              }).toString()}`}
            >
              新增关键场景
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <section className="rounded-lg border bg-card p-3">
          <h3 className="mb-3 font-semibold">当前客户关键场景（共 {scenarios.length} 个）</h3>
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const scenarioQuery = new URLSearchParams({
                scenarioId: scenario.id,
                ...currentQuery,
              }).toString();
              const active = scenario.id === selected.id;
              return (
                <Link
                  key={scenario.id}
                  href={`/threads/customers/${customerId}?${scenarioQuery}`}
                  className={`block rounded-md border p-3 transition-colors ${active ? "border-primary bg-muted/30" : "hover:bg-muted/20"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">关键场景：{scenario.keyProjectScenario}</div>
                    <div className="flex items-center gap-2">
                      <StageStatusBadge stageStatus={scenario.stageStatus} />
                      <RiskBadge riskLevel={scenario.riskLevel} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>负责人：{scenario.ownerName}</span>
                    <span>关键人：{scenario.keyPerson}</span>
                    <span>更新：{format(scenario.updatedAt, "yyyy-MM-dd", { locale: zhCN })}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border bg-card p-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold">关键场景详情面板</h3>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/threads/${selected.id}`}>进入完整编辑页</Link>
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <section className="rounded-md border p-3">
              <div className="mb-1 font-medium">基本信息</div>
              <div>项目场景：{selected.keyProjectScenario}</div>
              <div>产品线：{selected.productLine || "-"}</div>
              <div>关键场景说明：{String(basic.keyScenarioDescription || "-")}</div>
            </section>
            <section className="rounded-md border p-3">
              <div className="mb-1 font-medium">经营目标-扩大收入</div>
              <div>目标维度：{String(goal.targetDimension || "-")}</div>
              <div>业务阶段：{String(goal.businessStage || "-")}</div>
              <div>目标描述：{String(goal.targetDescription || "-")}</div>
              <div>经营目标是否达成：{formatBooleanOrText(goal.businessGoalAchieved)}</div>
            </section>
            <section className="rounded-md border p-3">
              <div className="mb-1 font-medium">客户成功-组织关系</div>
              <div>整体组织关系现状：{String(org.orgCurrentState || "-")}</div>
              <div>变化情况：{String(org.orgChanges || "-")}</div>
              <div className="mt-2 space-y-1">
                {stakeholders.length ? (
                  stakeholders.map((person, idx) => (
                    <div key={`stakeholder-${idx}`} className="rounded border bg-muted/20 px-2 py-1">
                      {String(person.name || "-")} / {String(person.department || "-")} / {String(person.level || "-")}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">暂无关键人条目</div>
                )}
              </div>
            </section>
            <section className="rounded-md border p-3">
              <div className="mb-1 font-medium">客户成功-价值兑现</div>
              <div>客户业务需求分析：{String(success.businessNeedAnalysis || "-")}</div>
              <div>关键人的个人需求：{String(success.personalNeeds || "-")}</div>
              <div>客户成功目标（SMART）：{String(success.smartGoal || "-")}</div>
              <div>是否与客户完成对齐：{formatBooleanOrText(success.alignedWithCustomer)}</div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
