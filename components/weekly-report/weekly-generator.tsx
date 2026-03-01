import { endOfWeek, format, startOfWeek } from "date-fns";

import { generateWeeklyReportFromExecutionAction } from "@/app/(dashboard)/weekly-reports/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildThreadExecutionSummary } from "@/lib/execution-progress";
import { listDistinctCustomers, listThreadsByCustomerIds } from "@/lib/repos/thread-repo";

export async function WeeklyGenerator({
  threadId,
  defaultCustomerId,
  defaultOwnerName,
  managerName,
  role,
  selectedCustomerId,
  selectedOwnerName,
}: {
  threadId: string;
  defaultCustomerId?: string | null;
  defaultOwnerName: string;
  managerName?: string;
  role?: string;
  selectedCustomerId?: string;
  selectedOwnerName?: string;
}) {
  const customers = await listDistinctCustomers();
  const effectiveCustomerId =
    selectedCustomerId || defaultCustomerId || customers[0]?.id || "";
  const allThreads = effectiveCustomerId
    ? await listThreadsByCustomerIds([effectiveCustomerId])
    : [];
  const ownerOptions = [...new Set(allThreads.map((item) => item.ownerName))];
  const ownerName = selectedOwnerName || defaultOwnerName;
  const scopedThreads = ownerName
    ? allThreads.filter((item) => item.ownerName === ownerName)
    : allThreads;
  const executionThreads = scopedThreads
    .map((thread) => {
      const summary = buildThreadExecutionSummary({
        threadId: thread.id,
        customerName: thread.customer,
        scenarioName: thread.keyProjectScenario,
        ownerName: thread.ownerName,
        executionSection: thread.executionSection,
      });
      return { thread, summary };
    })
    .filter((item) => item.summary.hasRecord);

  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader>
        <CardTitle>周报生成</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="grid gap-3 rounded-md border p-3 md:grid-cols-4">
          <input type="hidden" name="tab" value="weekly" />
          <input type="hidden" name="mode" value="view" />
          <div className="space-y-2">
            <Label htmlFor={`weeklyCustomerId-${threadId}`}>客户</Label>
            <select
              id={`weeklyCustomerId-${threadId}`}
              name="weeklyCustomerId"
              defaultValue={effectiveCustomerId}
              className="h-9 w-full rounded-md border px-3 text-sm"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`weeklyOwnerName-${threadId}`}>Owner</Label>
            <Input id={`weeklyOwnerName-${threadId}`} name="weeklyOwnerName" defaultValue={ownerName} list={`owner-list-${threadId}`} />
            <datalist id={`owner-list-${threadId}`}>
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner} />
              ))}
            </datalist>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button type="submit">筛选可生成场景</Button>
          </div>
        </form>

        {executionThreads.length === 0 ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            当前客户下无可用执行推进记录
          </div>
        ) : (
          <form action={generateWeeklyReportFromExecutionAction} className="space-y-3 rounded-md border p-3">
            <input type="hidden" name="managerName" value={managerName || ""} />
            <input type="hidden" name="role" value={role || ""} />
            <input type="hidden" name="customerId" value={effectiveCustomerId} />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`ownerName-${threadId}`}>周报Owner *</Label>
                <Input id={`ownerName-${threadId}`} name="ownerName" defaultValue={ownerName} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`weekStart-${threadId}`}>周开始 *</Label>
                <Input id={`weekStart-${threadId}`} name="weekStart" type="date" defaultValue={weekStart} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`weekEnd-${threadId}`}>周结束 *</Label>
                <Input id={`weekEnd-${threadId}`} name="weekEnd" type="date" defaultValue={weekEnd} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>关键场景（仅展示有执行推进记录）</Label>
              <div className="max-h-64 space-y-2 overflow-auto rounded-md border p-3">
                {executionThreads.map(({ thread, summary }) => (
                  <label key={thread.id} className="flex items-start gap-2 text-sm">
                    <input type="checkbox" name="threadIds" value={thread.id} />
                    <span>
                      [{thread.ownerName}] {thread.keyProjectScenario} · 执行事项{summary.totalCount}条 · 最近闭环：
                      {summary.lastClosedAt || "-"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit">生成周报</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
