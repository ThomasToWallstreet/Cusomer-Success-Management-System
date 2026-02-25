import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyReportDetail } from "@/lib/repos/weekly-report-repo";

export const dynamic = "force-dynamic";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

const riskLabelMap: Record<string, string> = {
  HIGH_RED: "高风险（红色）",
  MEDIUM_YELLOW: "中风险（黄色）",
  LOW_GREEN: "低风险（绿色）",
};

const keyStakeholderLabelMap: Record<string, string> = {
  NOT_YET_RESULT: "未出结果阶段",
  PENDING_CONFIRMATION: "效果待确认",
  AVERAGE_RESULT: "结果一般",
  GOOD_RECOGNIZED: "结果好-关键人认可",
  BAD_NOT_RECOGNIZED: "结果不好-关键人不认可",
  NOT_APPLICABLE: "不涉及",
};

const deliveryRiskLabelMap: Record<string, string> = {
  WORSENING: "恶化",
  NO_CHANGE: "无变化",
  IMPROVING: "改善",
  SIGNIFICANT_IMPROVING: "显著改善",
};

export default async function WeeklyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getWeeklyReportDetail(id);
  if (!report) notFound();
  const objectives = toRecord(report.weeklyObjectives);
  const plannedItems = toArray(report.plannedExecutionItems);
  const executedItems = toArray(report.executedItems);
  const conclusions = toRecord(report.qualitativeConclusions);
  const requiredNextActions = toArray(report.requiredNextActions);

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/weekly-reports">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回周计划与执行列表
        </Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>
            {report.customerRecord?.name || "未绑定客户"} ·{" "}
            {report.ownerName} | {format(report.weekStart, "yyyy-MM-dd", { locale: zhCN })} ~{" "}
            {format(report.weekEnd, "yyyy-MM-dd", { locale: zhCN })}
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
                    {String(item.title || "-")} / {String(item.type || "-")} / 状态：{String(item.status || "-")}
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
                    {String(item.executionItemId || item.title || "-")} / 状态：{String(item.status || "-")} / 结果：
                    {String(item.resultSummary || "-")}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">-</p>
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
            <p className="mt-1 text-sm">{riskLabelMap[report.satisfactionRiskLevel || ""] || "-"}</p>
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
                    {String(item.title || "-")} / 来源：{String(item.source || "-")} / 优先级：{String(item.priority || "-")}
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
