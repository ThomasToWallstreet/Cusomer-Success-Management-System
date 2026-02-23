import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyReportDetail } from "@/lib/repos/weekly-report-repo";

export const dynamic = "force-dynamic";

export default async function WeeklyReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getWeeklyReportDetail(id);
  if (!report) notFound();

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/weekly-reports">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回周报列表
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
            <h3 className="text-sm font-semibold">本周总结</h3>
            <p className="mt-1 text-sm">{report.summary}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">风险</h3>
            <p className="mt-1 text-sm">{report.risks || "-"}</p>
          </section>
          <section>
            <h3 className="text-sm font-semibold">下周计划</h3>
            <p className="mt-1 text-sm">{report.nextWeekPlan || "-"}</p>
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
