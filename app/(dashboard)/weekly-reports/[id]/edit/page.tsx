import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { WeeklyReportEditForm } from "@/components/weekly-report/weekly-report-edit-form";
import { Button } from "@/components/ui/button";
import { formatDateCST } from "@/lib/datetime";
import { getWeeklyReportDetail } from "@/lib/repos/weekly-report-repo";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function WeeklyReportEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const report = await getWeeklyReportDetail(id);
  if (!report) notFound();

  const managerName = getOne(query.managerName);
  const role = getOne(query.role);
  const backQuery = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href={backQuery ? `/weekly-reports?${backQuery}` : "/weekly-reports"}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回周计划与执行列表
        </Link>
      </Button>
      <h2 className="text-xl font-semibold">编辑周报</h2>
      <WeeklyReportEditForm
        report={{
          id: report.id,
          customerName: report.customerRecord?.name || "未绑定客户",
          ownerName: report.ownerName,
          weekStartText: formatDateCST(report.weekStart),
          weekEndText: formatDateCST(report.weekEnd),
          weeklyObjectives: report.weeklyObjectives,
          summary: report.summary,
          risks: report.risks,
          nextWeekPlan: report.nextWeekPlan,
          needSupport: report.needSupport,
          qualitativeConclusions: report.qualitativeConclusions,
          satisfactionRiskLevel: report.satisfactionRiskLevel,
          satisfactionRiskReason: report.satisfactionRiskReason,
        }}
        role={role}
        managerName={managerName}
      />
    </div>
  );
}
