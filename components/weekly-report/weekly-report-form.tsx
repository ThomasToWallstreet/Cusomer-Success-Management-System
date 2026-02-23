import { createWeeklyReportAction } from "@/app/(dashboard)/weekly-reports/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ThreadOption = {
  id: string;
  ownerName: string;
  customer: string;
  keyProjectScenario: string;
};

type Props = {
  owners: string[];
  selectedOwner?: string;
  weekStart: string;
  weekEnd: string;
  threadOptions: ThreadOption[];
};

export function WeeklyReportForm({ owners, selectedOwner, weekStart, weekEnd, threadOptions }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>创建周报</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createWeeklyReportAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner *</Label>
              <Input id="ownerName" name="ownerName" defaultValue={selectedOwner} list="owner-list" required />
              <datalist id="owner-list">
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
            <div className="max-h-52 space-y-2 overflow-auto rounded border p-3">
              {threadOptions.map((thread) => (
                <label key={thread.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="threadIds" value={thread.id} />
                  <span>
                    [{thread.ownerName}] {thread.customer} - {thread.keyProjectScenario}
                  </span>
                </label>
              ))}
              {threadOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无可选关键场景，请先创建关键场景。</p>
              ) : null}
            </div>
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
          <Button type="submit">保存周报</Button>
        </form>
      </CardContent>
    </Card>
  );
}
