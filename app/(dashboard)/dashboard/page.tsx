import { OverviewCards } from "@/components/dashboard/overview-cards";
import { ProgressBreakdown } from "@/components/dashboard/progress-breakdown";
import { QualitativeInsights } from "@/components/dashboard/qualitative-insights";
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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">仪表盘</h2>
          <p className="text-sm text-muted-foreground">整体进展与定性分析总览</p>
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
      <OverviewCards
        totalCount={snapshot.totalCount}
        statusCountMap={snapshot.statusCountMap}
        riskCountMap={snapshot.riskCountMap}
      />
      <ProgressBreakdown
        items={snapshot.stageBreakdown}
        customerId={selectedCustomerId}
        managerName={managerName}
        role={role}
      />
      <QualitativeInsights
        blockedRows={snapshot.blockedRows}
        topRisks={snapshot.topRisks}
        topSupports={snapshot.topSupports}
        customerId={selectedCustomerId}
        managerName={managerName}
        role={role}
      />
    </div>
  );
}
