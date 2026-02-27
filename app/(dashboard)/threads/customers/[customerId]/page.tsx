import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { QualitativeStatusBadge } from "@/components/shared/qualitative-status-badge";
import { GoalProgressPanel } from "@/components/thread/goal-progress-panel";
import { RiskBadge } from "@/components/shared/risk-badge";
import { StageStatusBadge } from "@/components/shared/stage-status-badge";
import { Button } from "@/components/ui/button";
import { ensureCustomerGoalWeeklySnapshot } from "@/lib/repos/customer-goal-weekly-snapshot-repo";
import { getCustomerById } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager, resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
import { listThreads } from "@/lib/repos/thread-repo";
import {
  getAlignedTone,
  getBusinessGoalTone,
  getCustomerGoalProgressSummary,
  getOrgCurrentTone,
  getScenarioGoalProgress,
} from "@/lib/thread-goal-progress";
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

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
      <p className="pt-1 text-xs text-muted-foreground">{label}</p>
      <p className="break-words whitespace-pre-wrap text-sm leading-6 text-foreground">{value || "-"}</p>
    </div>
  );
}

function DetailBadgeRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "GREEN" | "YELLOW" | "RED" | "NEUTRAL";
}) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] items-start gap-3">
      <p className="pt-1 text-xs text-muted-foreground">{label}</p>
      <QualitativeStatusBadge label="" value={value} tone={tone} />
    </div>
  );
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

  await ensureCustomerGoalWeeklySnapshot(customerId, scenarios);
  const selectedScenarioId = getOne(query.scenarioId) || scenarios[0].id;
  const selected = scenarios.find((item) => item.id === selectedScenarioId) || scenarios[0];
  const customerGoalSummary = getCustomerGoalProgressSummary(scenarios);

  const currentQuery = {
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  };

  const goal = toRecord(selected.goalSection);
  const org = toRecord(selected.orgSection);
  const success = toRecord(selected.successSection);
  const basic = toRecord(selected.activitySection);
  const stakeholders = Array.isArray(org.stakeholders) ? (org.stakeholders as Array<Record<string, unknown>>) : [];
  const selectedBusinessGoalAchieved = toText(goal.businessGoalAchieved) || "-";
  const selectedOrgChanges = toText(org.orgChanges) || "-";
  const selectedAlignedWithCustomer = formatBooleanOrText(success.alignedWithCustomer);

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

      <div className="grid gap-3 lg:grid-cols-[70%_30%] xl:gap-4">
        <section className="rounded-lg border bg-card p-3">
          <h3 className="mb-3 font-semibold">当前客户关键场景（共 {scenarios.length} 个）</h3>
          <div className="space-y-2">
            {scenarios.map((scenario) => {
              const scenarioQuery = new URLSearchParams({
                scenarioId: scenario.id,
                ...currentQuery,
              }).toString();
              const active = scenario.id === selected.id;
              const scenarioProgress = getScenarioGoalProgress(scenario);
              const businessGoalAchieved = scenarioProgress.businessGoalAchieved;
              const orgChanges = scenarioProgress.orgChanges;
              const alignedWithCustomer = scenarioProgress.alignedWithCustomer;
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
                  <div className="mt-2 flex flex-wrap gap-2">
                    <QualitativeStatusBadge
                      label="经营目标-扩大收入"
                      value={businessGoalAchieved}
                      tone={getBusinessGoalTone(businessGoalAchieved)}
                    />
                    <QualitativeStatusBadge
                      label="客户成功-组织关系"
                      value={orgChanges}
                      tone={getOrgCurrentTone(orgChanges)}
                    />
                    <QualitativeStatusBadge
                      label="客户成功-价值兑现"
                      value={alignedWithCustomer}
                      tone={getAlignedTone(alignedWithCustomer)}
                    />
                    <span className="inline-flex items-center rounded-full border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                      三目标完成：{scenarioProgress.doneCount}/{scenarioProgress.totalCount}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded bg-muted">
                    <div className="h-1.5 rounded bg-primary" style={{ width: `${scenarioProgress.doneRatio * 100}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <aside className="rounded-lg border bg-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">关键场景详情面板</h3>
              <p className="text-xs text-muted-foreground"></p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/threads/${selected.id}`}>进入完整编辑页</Link>
            </Button>
          </div>

          <div className="space-y-4">
            <GoalProgressPanel
              title="客户维度三目标汇总完成率"
              items={[
                { label: "经营目标-扩大收入", ratio: customerGoalSummary.revenueRate },
                { label: "客户成功-组织关系突破", ratio: customerGoalSummary.orgRate },
                { label: "客户成功-价值兑现", ratio: customerGoalSummary.valueRate },
              ]}
              sampleSize={customerGoalSummary.sampleSize}
            />
            <section className="rounded-md border p-3">
              <h4 className="mb-3 text-sm font-semibold">基本信息</h4>
              <div className="space-y-2">
                <DetailRow label="项目场景" value={selected.keyProjectScenario} />
                <DetailRow label="产品线" value={selected.productLine || "-"} />
                <DetailRow label="关键场景说明" value={String(basic.keyScenarioDescription || "-")} />
              </div>
            </section>
            <section className="rounded-md border p-3">
              <h4 className="mb-3 text-sm font-semibold">经营目标-扩大收入</h4>
              <div className="space-y-2">
                <DetailRow label="目标维度" value={String(goal.targetDimension || "-")} />
                <DetailRow label="业务阶段" value={String(goal.businessStage || "-")} />
                <DetailRow label="目标描述" value={String(goal.targetDescription || "-")} />
                <DetailBadgeRow
                  label="经营目标是否达成"
                  value={selectedBusinessGoalAchieved}
                  tone={getBusinessGoalTone(selectedBusinessGoalAchieved)}
                />
              </div>
            </section>
            <section className="rounded-md border p-3">
              <h4 className="mb-3 text-sm font-semibold">客户成功-组织关系</h4>
              <div className="space-y-2">
                <DetailRow label="变化情况" value={String(org.orgChanges || "-")} />
                <DetailBadgeRow
                  label="变化情况"
                  value={selectedOrgChanges}
                  tone={getOrgCurrentTone(selectedOrgChanges)}
                />
              </div>
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">关键人条目</p>
                {stakeholders.length ? (
                  stakeholders.map((person, idx) => (
                    <div key={`stakeholder-${idx}`} className="rounded-md border bg-muted/20 p-2">
                      <p className="text-sm font-medium">
                        {String(person.name || "-")} · {String(person.department || "-")} · {String(person.level || "-")}
                      </p>
                      <p className="text-xs text-muted-foreground">{String(person.description || "-")}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">暂无关键人条目</div>
                )}
              </div>
            </section>
            <section className="rounded-md border p-3">
              <h4 className="mb-3 text-sm font-semibold">客户成功-价值兑现</h4>
              <div className="space-y-2">
                <DetailRow label="客户业务需求分析" value={String(success.businessNeedAnalysis || "-")} />
                <DetailRow label="关键人的个人需求" value={String(success.personalNeeds || "-")} />
                <DetailRow label="客户成功目标（SMART）" value={String(success.smartGoal || "-")} />
                <DetailBadgeRow
                  label="是否与客户完成对齐"
                  value={selectedAlignedWithCustomer}
                  tone={getAlignedTone(selectedAlignedWithCustomer)}
                />
              </div>
            </section>
          </div>
        </aside>
      </div>
    </div>
  );
}
