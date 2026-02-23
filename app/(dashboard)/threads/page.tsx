import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CustomerPlanList } from "@/components/thread/customer-plan-list";
import {
  listDistinctCustomers,
  listThreads,
} from "@/lib/repos/thread-repo";
import { resolveCurrentManager, listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function ThreadsPage({
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
  const allowedCustomerIds = isSupervisorRole(role)
    ? undefined
    : await listCustomerIdsByManager(managerName === "ALL" ? undefined : managerName);
  const queryCustomerId = getOne(query.customerId);
  const filters = {
    customerId:
      queryCustomerId === "ALL" ||
      !queryCustomerId ||
      (allowedCustomerIds && !allowedCustomerIds.includes(queryCustomerId))
        ? undefined
        : queryCustomerId,
    customerIds: allowedCustomerIds,
    keyword: getOne(query.keyword),
  };

  const [rows, customers] = await Promise.all([
    listThreads(filters),
    listDistinctCustomers(allowedCustomerIds),
  ]);
  const grouped = Object.values(
    rows.reduce<
      Record<
        string,
        {
          customerId?: string | null;
          customerName: string;
          updatedAt: Date;
          scenarios: Array<(typeof rows)[number]>;
        }
      >
    >((acc, row) => {
      const key = row.customerId || `legacy:${row.customer}`;
      if (!acc[key]) {
        acc[key] = {
          customerId: row.customerId,
          customerName: row.customerRecord?.name || row.customer,
          updatedAt: row.updatedAt,
          scenarios: [],
        };
      }
      acc[key].scenarios.push(row);
      if (row.updatedAt > acc[key].updatedAt) {
        acc[key].updatedAt = row.updatedAt;
      }
      return acc;
    }, {}),
  ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  const createParams = new URLSearchParams({
    ...(filters.customerId ? { customerId: filters.customerId } : {}),
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();
  const baseParams = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">客户成功计划</h2>
        <Button asChild className="rounded-full px-4">
          <Link href={createParams ? `/threads/new?${createParams}` : "/threads/new"}>
            新增客户成功计划
          </Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">仅展示当前经理负责客户，以客户为一级查看多个关键场景和关键人。</p>
      <form className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
        <input type="hidden" name="managerName" value={managerName || ""} />
        <input type="hidden" name="role" value={role || ""} />
        <input
          name="keyword"
          defaultValue={filters.keyword}
          placeholder="客户/项目场景/关键人"
          className="h-9 w-[260px] rounded-md border px-3 text-sm"
        />
        <select
          name="customerId"
          defaultValue={filters.customerId || "ALL"}
          className="h-9 min-w-[180px] rounded-md border px-3 text-sm"
        >
          <option value="ALL">仅本人负责客户</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm">
          筛选
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          asChild
        >
          <Link href={baseParams ? `/threads?${baseParams}` : "/threads"}>重置</Link>
        </Button>
      </form>
      <CustomerPlanList groups={grouped} managerName={managerName} role={role} />
    </div>
  );
}
