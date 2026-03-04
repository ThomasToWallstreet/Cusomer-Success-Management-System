import { updateWeeklyReportAction } from "@/app/(dashboard)/weekly-reports/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  deliveryBreakthroughRiskResultOptions,
  keyStakeholderRecognitionResultOptions,
  satisfactionRiskLevelOptions,
} from "@/lib/constants/domain";
import { toRecord, toText } from "@/lib/weekly-report-view";

export function WeeklyReportEditForm({
  report,
  role,
  managerName,
}: {
  report: {
    id: string;
    customerName: string;
    ownerName: string;
    weekStartText: string;
    weekEndText: string;
    weeklyObjectives: unknown;
    summary: string;
    risks: string | null;
    nextWeekPlan: string | null;
    needSupport: string | null;
    qualitativeConclusions: unknown;
    satisfactionRiskLevel: string | null;
    satisfactionRiskReason: string | null;
  };
  role?: string;
  managerName?: string;
}) {
  const objectives = toRecord(report.weeklyObjectives);
  const conclusions = toRecord(report.qualitativeConclusions);

  return (
    <form action={updateWeeklyReportAction} className="space-y-4 rounded-md border bg-card p-4">
      <input type="hidden" name="id" value={report.id} />
      <input type="hidden" name="role" value={role || ""} />
      <input type="hidden" name="managerName" value={managerName || ""} />

      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-2">
          <Label>客户</Label>
          <Input value={report.customerName} readOnly />
        </div>
        <div className="space-y-2">
          <Label>Owner</Label>
          <Input value={report.ownerName} readOnly />
        </div>
        <div className="space-y-2">
          <Label>周开始</Label>
          <Input value={report.weekStartText} readOnly />
        </div>
        <div className="space-y-2">
          <Label>周结束</Label>
          <Input value={report.weekEndText} readOnly />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weeklyObjectives">本周承接目标 *</Label>
        <Textarea
          id="weeklyObjectives"
          name="weeklyObjectives"
          rows={3}
          defaultValue={toText(objectives.text)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="summary">本周执行总览 *</Label>
        <Textarea id="summary" name="summary" rows={4} defaultValue={report.summary} required />
      </div>

      <div className="rounded-md border p-3">
        <h3 className="mb-3 text-sm font-semibold">定性结论</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="deliveryBreakthroughRiskResult">突破落地风险结果 *</Label>
            <select
              id="deliveryBreakthroughRiskResult"
              name="deliveryBreakthroughRiskResult"
              className="h-9 w-full rounded-md border px-3 text-sm"
              defaultValue={toText(conclusions.deliveryBreakthroughRiskResult) || "NO_CHANGE"}
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
              defaultValue={toText(conclusions.keyStakeholderRecognitionResult) || "PENDING_CONFIRMATION"}
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
            <Textarea
              id="deliveryBreakthroughRiskComment"
              name="deliveryBreakthroughRiskComment"
              rows={3}
              defaultValue={toText(conclusions.deliveryBreakthroughRiskComment)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyStakeholderRecognitionComment">关键人认可结果说明 *</Label>
            <Textarea
              id="keyStakeholderRecognitionComment"
              name="keyStakeholderRecognitionComment"
              rows={3}
              defaultValue={toText(conclusions.keyStakeholderRecognitionComment)}
              required
            />
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
              defaultValue={report.satisfactionRiskLevel || "MEDIUM_YELLOW"}
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
            <Textarea
              id="satisfactionRiskReason"
              name="satisfactionRiskReason"
              rows={3}
              defaultValue={report.satisfactionRiskReason || ""}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="risks">风险</Label>
        <Textarea id="risks" name="risks" rows={3} defaultValue={report.risks || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nextWeekPlan">下周计划</Label>
        <Textarea id="nextWeekPlan" name="nextWeekPlan" rows={3} defaultValue={report.nextWeekPlan || ""} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="needSupport">需要支持</Label>
        <Textarea id="needSupport" name="needSupport" rows={3} defaultValue={report.needSupport || ""} />
      </div>

      <div className="flex justify-end">
        <Button type="submit">保存并返回详情</Button>
      </div>
    </form>
  );
}
