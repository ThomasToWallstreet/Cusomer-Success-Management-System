import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { updateWeeklyActionStatusQuickAction } from "@/app/(dashboard)/weekly-reports/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateCST } from "@/lib/datetime";
import { getWeeklyReportDetail } from "@/lib/repos/weekly-report-repo";
import {
  actionPriorityLabelMap,
  deliveryRiskLabelMap,
  executionStatusLabelMap,
  keyStakeholderLabelMap,
  toArray,
  toRecord,
  toText,
  weeklyRiskLabelMap,
} from "@/lib/weekly-report-view";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function WeeklyReportDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const managerName = getOne(query.managerName) || "";
  const role = getOne(query.role) || "";
  const report = await getWeeklyReportDetail(id);
  if (!report) notFound();
  const objectives = toRecord(report.weeklyObjectives);
  const plannedItems = toArray(report.plannedExecutionItems);
  const executedItems = toArray(report.executedItems);
  const conclusions = toRecord(report.qualitativeConclusions);
  const requiredNextActions = toArray(report.requiredNextActions);
  const actionDiffRows = report.actionSnapshots
    .map((snapshot) => {
      const baselineStatus = snapshot.baselineStatus;
      const currentStatus = snapshot.action.status;
      const statusChanged = baselineStatus !== currentStatus;
      const baselineDeadline = snapshot.baselineDeadlineAt?.toISOString() || "";
      const currentDeadline = snapshot.action.deadlineAt?.toISOString() || "";
      const deadlineChanged = baselineDeadline !== currentDeadline;
      const becameDone = baselineStatus !== "DONE" && currentStatus === "DONE";
      const becameBlocked = baselineStatus !== "BLOCKED" && currentStatus === "BLOCKED";
      const becameOverdue =
        snapshot.baselineDeadlineAt &&
        snapshot.action.deadlineAt &&
        snapshot.baselineDeadlineAt.getTime() >= report.weekEnd.getTime() &&
        snapshot.action.deadlineAt.getTime() < report.weekEnd.getTime();
      return {
        actionId: snapshot.action.id,
        title: snapshot.action.title,
        baselineStatus,
        currentStatus,
        statusChanged,
        deadlineChanged,
        becameDone,
        becameBlocked,
        becameOverdue,
      };
    })
    .filter((item) => item.statusChanged || item.deadlineChanged || item.becameDone || item.becameBlocked || item.becameOverdue);

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/weekly-reports">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回周计划与执行列表
        </Link>
      </Button>
      <div className="flex justify-end">
        <Button variant="outline" asChild>
          <Link href={`/weekly-reports/${report.id}/edit`}>编辑周报</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {report.customerRecord?.name || "未绑定客户"} ·{" "}
            {report.ownerName} | {formatDateCST(report.weekStart)} ~ {formatDateCST(report.weekEnd)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h3 className="text-sm font-semibold">本周承接目标</h3>
            <p className="mt-1 text-sm">{String(objectives.text || "-")}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">本周总结</h3>
            <p className="mt-1 text-sm">{report.summary}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">本周动作清单</h3>
            <div className="mt-1 space-y-1 text-sm">
              {plannedItems.length ? (
                plannedItems.map((item, index) => (
                  <p key={`planned-${index}`} className="rounded border px-2 py-1">
                    {toText(item.title) || "-"} / 关联目标：{toText(item.linkedGoal) || "-"} / 状态：
                    {executionStatusLabelMap[toText(item.status)] || "待执行"}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">执行记录</h3>
            <div className="mt-1 space-y-1 text-sm">
              {executedItems.length ? (
                executedItems.map((item, index) => (
                  <p key={`executed-${index}`} className="rounded border px-2 py-1">
                    {toText(item.title) || toText(item.executionItemId) || "-"} / 状态：
                    {executionStatusLabelMap[toText(item.status)] || "待执行"} / 结果：
                    {toText(item.resultSummary) || "-"}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">-</p>
              )}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">本周变化（相对生成基线）</h3>
            <div className="mt-1 space-y-1 text-sm">
              {actionDiffRows.length ? (
                actionDiffRows.map((row, index) => (
                  <p key={`diff-${index}`} className="rounded border px-2 py-1">
                    {row.title}：{executionStatusLabelMap[row.baselineStatus] || row.baselineStatus} →{" "}
                    {executionStatusLabelMap[row.currentStatus] || row.currentStatus}
                    {row.becameDone ? "（新增完成）" : ""}
                    {row.becameBlocked ? "（新增阻塞）" : ""}
                    {row.becameOverdue ? "（新增逾期）" : ""}
                    {row.currentStatus !== "DONE" ? (
                      <span className="ml-2 inline-flex">
                        <form action={updateWeeklyActionStatusQuickAction}>
                          <input type="hidden" name="weeklyReportId" value={report.id} />
                          <input type="hidden" name="actionId" value={row.actionId} />
                          <input type="hidden" name="nextStatus" value="DONE" />
                          <input type="hidden" name="managerName" value={managerName} />
                          <input type="hidden" name="role" value={role} />
                          <button type="submit" className="text-xs text-primary underline">
                            标记完成
                          </button>
                        </form>
                      </span>
                    ) : null}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">本周暂无基线变化</p>
              )}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">定性结论</h3>
            <div className="mt-1 space-y-1 text-sm">
              <p>
                突破落地风险结果：{deliveryRiskLabelMap[String(conclusions.deliveryBreakthroughRiskResult || "")] || "-"}
              </p>
              <p className="text-muted-foreground">说明：{String(conclusions.deliveryBreakthroughRiskComment || "-")}</p>
              <p>
                关键人认可结果：
                {keyStakeholderLabelMap[String(conclusions.keyStakeholderRecognitionResult || "")] || "-"}
              </p>
              <p className="text-muted-foreground">说明：{String(conclusions.keyStakeholderRecognitionComment || "-")}</p>
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">满意度风险评估</h3>
            <p className="mt-1 text-sm">{weeklyRiskLabelMap[report.satisfactionRiskLevel || ""] || "-"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{report.satisfactionRiskReason || "-"}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">风险</h3>
            <p className="mt-1 text-sm">{report.risks || "-"}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">下周计划</h3>
            <p className="mt-1 text-sm">{report.nextWeekPlan || "-"}</p>
            <div className="mt-2 space-y-1 text-sm">
              {requiredNextActions.length ? (
                requiredNextActions.map((item, index) => (
                  <p key={`next-required-${index}`} className="rounded border px-2 py-1">
                    {toText(item.title) || "-"} / 优先级：
                    {actionPriorityLabelMap[toText(item.priority)] || toText(item.priority) || "-"}
                  </p>
                ))
              ) : null}
            </div>
          </section>
          <section>
            <h3 className="text-sm font-semibold">需要支持</h3>
            <p className="mt-1 text-sm">{report.needSupport || "-"}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">关联关键场景</h3>
            <div className="mt-2 space-y-1">
              {report.threadLinks.map((item) => (
                <Link key={item.id} href={`/threads/${item.thread.id}`} className="block text-sm underline">
                  {(item.thread.customerRecord?.name || item.thread.customer) + " - " + item.thread.keyProjectScenario}
                </Link>
              ))}
              {report.threadLinks.length === 0 ? <p className="text-sm text-muted-foreground">无关联关键场景</p> : null}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
