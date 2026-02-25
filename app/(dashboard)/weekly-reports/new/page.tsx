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
import {
  deliveryBreakthroughRiskResultOptions,
  keyStakeholderRecognitionResultOptions,
  satisfactionRiskLevelOptions,
} from "@/lib/constants/domain";

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
  const defaultPlannedExecutionJson = JSON.stringify(
    [
      {
        id: "plan-1",
        type: "GOAL_DERIVED",
        title: "",
        linkedGoal: "",
        owner: ownerQuery || "",
        status: "TODO",
      },
    ],
    null,
    2,
  );
  const defaultExecutedItemsJson = JSON.stringify([], null, 2);
  const defaultRequiredNextActionsJson = JSON.stringify(
    [
      {
        title: "",
        source: "",
        priority: "P1",
      },
    ],
    null,
    2,
  );

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
          返回周计划与执行列表
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
          <Label htmlFor="weeklyObjectives">本周承接目标 *</Label>
          <Textarea
            id="weeklyObjectives"
            name="weeklyObjectives"
            rows={3}
            required
            placeholder="按扩大收入/组织关系提升/需求理解分别填写本周承接目标。"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary">本周执行总览 *</Label>
          <Textarea id="summary" name="summary" rows={3} required placeholder="总结本周关键进展与产出。" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="plannedExecutionJson">本周动作清单（JSON数组）*</Label>
          <Textarea id="plannedExecutionJson" name="plannedExecutionJson" rows={8} defaultValue={defaultPlannedExecutionJson} required />
          <p className="text-xs text-muted-foreground">
            每条建议包含：id/type(GOAL_DERIVED或KCP)/title/linkedGoal/owner/status。
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="executedItemsJson">执行记录（JSON数组）*</Label>
          <Textarea id="executedItemsJson" name="executedItemsJson" rows={8} defaultValue={defaultExecutedItemsJson} required />
          <p className="text-xs text-muted-foreground">每条建议包含：executionItemId/status/resultSummary/evidence/blockedReason。</p>
        </div>
        <div className="rounded-md border p-3">
          <h3 className="mb-3 text-sm font-semibold">定性结论（用于满意度风险评估）</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryBreakthroughRiskResult">突破落地风险结果 *</Label>
              <select
                id="deliveryBreakthroughRiskResult"
                name="deliveryBreakthroughRiskResult"
                className="h-9 w-full rounded-md border px-3 text-sm"
                defaultValue="NO_CHANGE"
                required
              >
                {deliveryBreakthroughRiskResultOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyStakeholderRecognitionResult">关键人认可结果 *</Label>
              <select
                id="keyStakeholderRecognitionResult"
                name="keyStakeholderRecognitionResult"
                className="h-9 w-full rounded-md border px-3 text-sm"
                defaultValue="PENDING_CONFIRMATION"
                required
              >
                {keyStakeholderRecognitionResultOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryBreakthroughRiskComment">突破落地风险结果说明 *</Label>
              <Textarea id="deliveryBreakthroughRiskComment" name="deliveryBreakthroughRiskComment" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyStakeholderRecognitionComment">关键人认可结果说明 *</Label>
              <Textarea id="keyStakeholderRecognitionComment" name="keyStakeholderRecognitionComment" rows={3} required />
            </div>
          </div>
        </div>
        <div className="rounded-md border p-3">
          <h3 className="mb-3 text-sm font-semibold">满意度风险评估</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="satisfactionRiskLevel">当前风险等级 *</Label>
              <select
                id="satisfactionRiskLevel"
                name="satisfactionRiskLevel"
                className="h-9 w-full rounded-md border px-3 text-sm"
                defaultValue="MEDIUM_YELLOW"
                required
              >
                {satisfactionRiskLevelOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="satisfactionRiskReason">风险评估理由 *</Label>
              <Textarea id="satisfactionRiskReason" name="satisfactionRiskReason" rows={3} required />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="requiredNextActionsJson">下周必要动作（JSON数组）*</Label>
          <Textarea
            id="requiredNextActionsJson"
            name="requiredNextActionsJson"
            rows={6}
            defaultValue={defaultRequiredNextActionsJson}
            required
          />
          <p className="text-xs text-muted-foreground">每条建议包含：title/source/priority。</p>
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
          保存周计划与执行
        </Button>
        {!customerIdQuery ? (
          <p className="text-sm text-amber-600">请先在上方选择客户，再创建周计划与执行。</p>
        ) : null}
      </form>
    </div>
  );
}
