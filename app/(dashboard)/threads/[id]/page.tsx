import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { StageSectionCard } from "@/components/thread/stage-section-card";
import { ThreadHeaderSticky } from "@/components/thread/thread-header-sticky";
import { ThreadStepper } from "@/components/thread/thread-stepper";
import { Accordion } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { WeeklyReportTimeline } from "@/components/weekly-report/weekly-report-timeline";
import { getThreadDetail } from "@/lib/repos/thread-repo";

export const dynamic = "force-dynamic";

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thread = await getThreadDetail(id);
  if (!thread) notFound();

  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href="/threads">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回客户成功计划
        </Link>
      </Button>
      <ThreadHeaderSticky thread={thread} />
      <ThreadStepper
        id={thread.id}
        stage={thread.stage}
        stageStatus={thread.stageStatus}
        riskLevel={thread.riskLevel}
        nextAction={thread.nextAction}
      />

      <Accordion type="multiple" className="rounded-lg border bg-card px-4">
        <StageSectionCard id={thread.id} section="goalSection" label="经营目标" value={thread.goalSection} />
        <StageSectionCard id={thread.id} section="orgSection" label="组织关系" value={thread.orgSection} />
        <StageSectionCard
          id={thread.id}
          section="successSection"
          label="需求与成功目标"
          value={thread.successSection}
        />
        <StageSectionCard id={thread.id} section="activitySection" label="关键活动" value={thread.activitySection} />
        <StageSectionCard id={thread.id} section="executionSection" label="执行推进" value={thread.executionSection} />
      </Accordion>

      <WeeklyReportTimeline
        items={thread.weeklyReportLinks.map((item) => ({
          id: item.weeklyReport.id,
          ownerName: item.weeklyReport.ownerName,
          weekStart: item.weeklyReport.weekStart,
          weekEnd: item.weeklyReport.weekEnd,
          summary: item.weeklyReport.summary,
        }))}
      />
    </div>
  );
}
