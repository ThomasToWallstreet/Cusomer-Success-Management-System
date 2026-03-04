import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WeeklyReportDashboard } from "@/components/weekly-report/weekly-report-dashboard";
import { WeeklyReportMetrics } from "@/components/weekly-report/weekly-report-metrics";
import { WeeklyOwnerSummary } from "@/components/weekly-report/weekly-owner-summary";
import { WeeklyReportTable } from "@/components/weekly-report/weekly-report-table";
import { getExecutionQuarterYearMetrics } from "@/lib/repos/execution-action-repo";
import { buildWeeklyOwnerSummary, listWeeklyReports } from "@/lib/repos/weekly-report-repo";
import { listCustomers, listCustomersByManager } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager, resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export default async function WeeklyReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const role = parseViewerRole(getOne(query.role));
  const managerNameQuery = getOne(query.managerName);
  const { managerName } = await resolveCurrentManager(managerNameQuery, {
    allowAll: isSupervisorRole(role),
  });
  const customerIds = isSupervisorRole(role)
    ? undefined
    : await listCustomerIdsByManager(managerName === "ALL" ? undefined : managerName);
  const customerIdQuery = getOne(query.customerId);
  const customerId = customerIdQuery &&
    (!customerIds || customerIds.includes(customerIdQuery))
      ? customerIdQuery
      : undefined;
  const weekStartText = getOne(query.weekStart);
  const weekEndText = getOne(query.weekEnd);
  const weekStart = parseDate(weekStartText);
  const weekEnd = parseDate(weekEndText);

  const [reports, summary, customers, metrics] = await Promise.all([
    listWeeklyReports(weekStart, weekEnd, customerId, customerIds),
    buildWeeklyOwnerSummary(weekStart, weekEnd, customerId, customerIds),
    isSupervisorRole(role)
      ? listCustomers()
      : listCustomersByManager(managerName === "ALL" ? undefined : managerName),
    getExecutionQuarterYearMetrics(),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">周计划与执行列表</h2>
        <p className="text-sm text-muted-foreground">周报仅支持由执行推进自动生成后编辑</p>
      </div>

      <form className="grid gap-4 rounded border bg-card p-4 md:grid-cols-4">
        <input type="hidden" name="managerName" value={managerName || ""} />
        <input type="hidden" name="role" value={role} />
        <div className="space-y-2">
          <Label htmlFor="customerId">客户</Label>
          <select id="customerId" name="customerId" defaultValue={customerId || ""} className="h-9 w-full rounded-md border px-3 text-sm">
            <option value="">全部客户</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekStart">周开始</Label>
          <Input id="weekStart" name="weekStart" type="date" defaultValue={weekStartText} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="weekEnd">周结束</Label>
          <Input id="weekEnd" name="weekEnd" type="date" defaultValue={weekEndText} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit">筛选</Button>
          <Button type="button" variant="outline" asChild>
            <Link
              href={`/weekly-reports?${new URLSearchParams({
                ...(managerName ? { managerName } : {}),
                ...(role ? { role } : {}),
              }).toString()}`}
            >
              重置
            </Link>
          </Button>
        </div>
      </form>
      <WeeklyReportMetrics metrics={metrics} />

      <WeeklyReportDashboard
        rows={reports.map((item) => ({
          id: item.id,
          customerName: item.customerRecord?.name || "-",
          ownerName: item.ownerName,
          weekStart: item.weekStart,
          weekEnd: item.weekEnd,
          summary: item.summary,
          threadCount: item.threadLinks.length,
          satisfactionRiskLevel: item.satisfactionRiskLevel,
          plannedExecutionItems: item.plannedExecutionItems,
          executedItems: item.executedItems,
          requiredNextActions: item.requiredNextActions,
          nextWeekPlan: item.nextWeekPlan,
        }))}
      />

      <WeeklyOwnerSummary rows={summary} />
      <WeeklyReportTable
        rows={reports.map((item) => {
          const conclusions = toRecord(item.qualitativeConclusions);
          return {
            id: item.id,
            customerName: item.customerRecord?.name || "-",
            ownerName: item.ownerName,
            weekStart: item.weekStart,
            weekEnd: item.weekEnd,
            summary: item.summary,
            threadCount: item.threadLinks.length,
            createdAt: item.createdAt,
            satisfactionRiskLevel: item.satisfactionRiskLevel,
            keyStakeholderRecognitionResult: String(conclusions.keyStakeholderRecognitionResult || ""),
          };
        })}
        role={role}
        managerName={managerName}
      />
    </div>
  );
}
