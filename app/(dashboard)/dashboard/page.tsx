import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardSnapshotByCustomer } from "@/lib/repos/dashboard-repo";
import { listCustomers, listCustomersByManager } from "@/lib/repos/customer-repo";
import { resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const role = parseViewerRole(getOne(query.role));
  const customerId = getOne(query.customerId) || undefined;
  const managerNameQuery = getOne(query.managerName);
  const { managerName } = await resolveCurrentManager(managerNameQuery, {
    allowAll: isSupervisorRole(role),
  });
  const customers = isSupervisorRole(role)
    ? await listCustomers()
    : await listCustomersByManager(managerName === "ALL" ? undefined : managerName);
  const customerIds = customers.map((item) => item.id);
  const selectedCustomerId = customerId && customerIds.includes(customerId) ? customerId : undefined;
  const snapshot = await getDashboardSnapshotByCustomer(selectedCustomerId, customerIds);
  const recognitionLabelMap: Record<string, string> = {
    NOT_YET_RESULT: "未出结果阶段",
    PENDING_CONFIRMATION: "效果待确认",
    AVERAGE_RESULT: "结果一般",
    GOOD_RECOGNIZED: "结果好-关键人认可",
    BAD_NOT_RECOGNIZED: "结果不好-关键人不认可",
    NOT_APPLICABLE: "不涉及",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">管理驾驶舱</h2>
          <p className="text-sm text-muted-foreground">目标承接、执行健康、结论风险与管理动作总览</p>
        </div>
        <form className="flex items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="customerId" className="text-sm text-muted-foreground">
              客户视角
            </label>
            <input type="hidden" name="managerName" value={managerName || ""} />
            <input type="hidden" name="role" value={role} />
            <select id="customerId" name="customerId" defaultValue={selectedCustomerId || ""} className="h-9 rounded-md border px-3 text-sm">
              <option value="">全部客户</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="h-9 rounded-md border px-3 text-sm">
            应用
          </button>
        </form>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">目标承接趋势</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>关键场景总数：{snapshot.totalCount}</p>
            <p>周承接目标填写率：{Math.round(snapshot.executionHealthRates.objectiveCarryRate * 100)}%</p>
            <p>阶段推进中：{snapshot.statusCountMap.IN_PROGRESS}</p>
            <p>阶段已完成：{snapshot.statusCountMap.DONE}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">执行健康</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>计划动作数：{snapshot.executionHealth.plannedTotal}</p>
            <p>已执行动作数：{snapshot.executionHealth.executedTotal}</p>
            <p>完成率：{Math.round(snapshot.executionHealthRates.completionRate * 100)}%</p>
            <p>阻塞率：{Math.round(snapshot.executionHealthRates.blockedRate * 100)}%</p>
            <p>证据完整率：{Math.round(snapshot.executionHealthRates.evidenceIntegrityRate * 100)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">结论与风险</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>高风险（红色）：{snapshot.riskLevelCountMap.HIGH_RED}</p>
            <p>中风险（黄色）：{snapshot.riskLevelCountMap.MEDIUM_YELLOW}</p>
            <p>低风险（绿色）：{snapshot.riskLevelCountMap.LOW_GREEN}</p>
            <p>关键人不认可：{snapshot.recognitionCountMap.BAD_NOT_RECOGNIZED}</p>
            <p>关键人认可：{snapshot.recognitionCountMap.GOOD_RECOGNIZED}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">管理动作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>阻塞关键场景：{snapshot.statusCountMap.BLOCKED}</p>
            <p>高风险必要动作：{snapshot.highRiskRequiredActions.length}</p>
            <p>需支持摘录：{snapshot.topSupports.length}</p>
            <p>风险摘录：{snapshot.topRisks.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">关键人认可结果分布</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.entries(snapshot.recognitionCountMap).map(([key, count]) => (
              <p key={key}>
                {recognitionLabelMap[key] || key}：{count}
              </p>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">高风险必要动作清单（Top 10）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {snapshot.highRiskRequiredActions.length ? (
              snapshot.highRiskRequiredActions.map((item: Record<string, unknown>, index: number) => (
                <div key={`required-${index}`} className="rounded border p-2">
                  <p>动作：{String(item.title || "-")}</p>
                  <p className="text-muted-foreground">来源：{String(item.source || "-")} / 优先级：{String(item.priority || "-")}</p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">暂无高风险必要动作</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
