import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { endOfWeek, format, startOfWeek } from "date-fns";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createWeeklyReportAction } from "@/app/(dashboard)/weekly-reports/actions";
import { listOwners, listThreadsByCustomerIds } from "@/lib/repos/thread-repo";
import { ThreadMultiSelect } from "@/components/weekly-report/thread-multi-select";
import { listCustomers, listCustomersByManager } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager, resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function WeeklyReportNewPage({
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
  const rawCustomerIdQuery = getOne(query.customerId);
  const customerIdQuery =
    rawCustomerIdQuery && (!allowedCustomerIds || allowedCustomerIds.includes(rawCustomerIdQuery))
      ? rawCustomerIdQuery
      : undefined;
  const ownerQuery = getOne(query.ownerName);
  const customers = isSupervisorRole(role)
    ? await listCustomers()
    : await listCustomersByManager(managerName === "ALL" ? undefined : managerName);
  const ownerCustomerIds = customerIdQuery ? [customerIdQuery] : (allowedCustomerIds || customers.map((item) => item.id));
  const owners = await listOwners(customerIdQuery, allowedCustomerIds);
  const threads = await listThreadsByCustomerIds(ownerCustomerIds, ownerQuery);

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link
          href={`/weekly-reports?${new URLSearchParams({
            ...(managerName ? { managerName } : {}),
            ...(role ? { role } : {}),
          }).toString()}`}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回周报列表
        </Link>
      </Button>

      <form className="rounded border bg-card p-4">
        <input type="hidden" name="managerName" value={managerName || ""} />
        <input type="hidden" name="role" value={role} />
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="customerIdQuery">先选择客户</Label>
            <select id="customerIdQuery" name="customerId" defaultValue={customerIdQuery || ""} className="h-9 w-full rounded-md border px-3 text-sm">
              <option value="">-- 请选择客户 --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerNameQuery">可选：按 owner 过滤关键场景</Label>
            <Input id="ownerNameQuery" name="ownerName" defaultValue={ownerQuery} list="owner-list" />
            <datalist id="owner-list">
              {owners.map((owner) => (
                <option key={owner} value={owner} />
              ))}
            </datalist>
          </div>
          <Button type="submit">筛选关键场景</Button>
        </div>
      </form>

      <form action={createWeeklyReportAction} className="space-y-4 rounded border bg-card p-4">
        <input type="hidden" name="managerName" value={managerName || ""} />
        <input type="hidden" name="role" value={role} />
        <input type="hidden" name="customerId" value={customerIdQuery || ""} />
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="customerIdReadonly">客户 *</Label>
            <Input
              id="customerIdReadonly"
              value={customers.find((item) => item.id === customerIdQuery)?.name || "请先在上方选择客户"}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner *</Label>
            <Input id="ownerName" name="ownerName" defaultValue={ownerQuery} list="owner-final-list" required />
            <datalist id="owner-final-list">
              {owners.map((owner) => (
                <option key={owner} value={owner} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekStart">周开始 *</Label>
            <Input id="weekStart" name="weekStart" type="date" defaultValue={weekStart} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekEnd">周结束 *</Label>
            <Input id="weekEnd" name="weekEnd" type="date" defaultValue={weekEnd} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>关联关键场景（可多选）</Label>
          <ThreadMultiSelect threadOptions={threads} selectedOwner={ownerQuery} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">本周总结 *</Label>
          <Textarea id="summary" name="summary" rows={4} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="risks">风险</Label>
          <Textarea id="risks" name="risks" rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextWeekPlan">下周计划</Label>
          <Textarea id="nextWeekPlan" name="nextWeekPlan" rows={3} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="needSupport">需要支持</Label>
          <Textarea id="needSupport" name="needSupport" rows={3} />
        </div>
        <Button type="submit" disabled={!customerIdQuery}>
          保存周报
        </Button>
        {!customerIdQuery ? (
          <p className="text-sm text-amber-600">请先在上方选择客户，再创建周报。</p>
        ) : null}
      </form>
    </div>
  );
}
