import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ActivityAddModule } from "@/components/thread/activity-add-module";
import { PlanProgressModule } from "@/components/thread/plan-progress-module";
import { ThreadDetailReadonly } from "@/components/thread/thread-detail-readonly";
import { ThreadStepper } from "@/components/thread/thread-stepper";
import { Button } from "@/components/ui/button";
import { getThreadDetail } from "@/lib/repos/thread-repo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;
type PlanTabKey = "progress" | "activity-add" | "weekly";

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseTab(value: string | undefined): PlanTabKey {
  if (value === "activity-add" || value === "weekly") return value;
  if (value === "plan") return "progress";
  return "progress";
}

export default async function ThreadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const tab = parseTab(getOne(query.tab));
  const savedAction = getOne(query.savedAction) || "";
  const managerName = getOne(query.managerName);
  const role = getOne(query.role);

  const thread = await getThreadDetail(id);
  if (!thread) notFound();

  const activity = toRecord(thread.activitySection);
  const success = toRecord(thread.successSection);
  const scenarioDisplayName =
    toText(toRecord(activity.scenarioMasterSnapshot).name) ||
    toText(toRecord(success.scenarioMasterSnapshot).name) ||
    thread.keyProjectScenario;

  const tabLink = (nextTab: PlanTabKey) => {
    const params = new URLSearchParams({
      tab: nextTab,
      ...(managerName ? { managerName: String(managerName) } : {}),
      ...(role ? { role: String(role) } : {}),
    });
    return `/threads/${thread.id}?${params.toString()}`;
  };

  const backHref =
    thread.customerId
      ? `/threads/customers/${thread.customerId}?${new URLSearchParams({
          scenarioId: thread.id,
          ...(managerName ? { managerName: String(managerName) } : {}),
          ...(role ? { role: String(role) } : {}),
        }).toString()}`
      : managerName || role
        ? `/threads?${new URLSearchParams({
            ...(managerName ? { managerName: String(managerName) } : {}),
            ...(role ? { role: String(role) } : {}),
          }).toString()}`
        : "/threads";

  return (
    <div className="space-y-4">
      <Button className="bg-black text-white hover:bg-black/90" asChild>
        <Link href={backHref}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回客户成功计划
        </Link>
      </Button>

      <section className="space-y-3 rounded-lg border bg-card p-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant={tab === "progress" ? "default" : "outline"} size="sm" asChild>
            <Link href={tabLink("progress")}>计划进展详情</Link>
          </Button>
          <Button variant={tab === "activity-add" ? "default" : "outline"} size="sm" asChild>
            <Link href={tabLink("activity-add")}>具体活动新增</Link>
          </Button>
          <Button variant={tab === "weekly" ? "default" : "outline"} size="sm" asChild>
            <Link href={tabLink("weekly")}>周报生成</Link>
          </Button>
        </div>

        {tab === "progress" ? (
          <div className="space-y-3">
            {savedAction === "save_execution" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">已保存</div>
            ) : null}

            <div className={cn("grid gap-4 xl:grid-cols-[minmax(0,1fr)_560px]")}>
              <div className="space-y-3">
                <ThreadStepper
                  id={thread.id}
                  stage={thread.stage}
                  stageStatus={thread.stageStatus}
                  riskLevel={thread.riskLevel}
                  nextAction={thread.nextAction}
                />
                <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  计划详情用于展示全貌；新增与维护具体活动请使用「具体活动新增」模块。
                </div>
                <ThreadDetailReadonly
                  thread={{
                    id: thread.id,
                    customer: thread.customer,
                    ownerName: thread.ownerName,
                    keyPerson: thread.keyPerson,
                    keyPersonDept: thread.keyPersonDept,
                    keyProjectScenario: scenarioDisplayName,
                    productLine: thread.productLine,
                    stageStatus: thread.stageStatus,
                    riskLevel: thread.riskLevel,
                    nextAction: thread.nextAction,
                    createdAt: thread.createdAt,
                    updatedAt: thread.updatedAt,
                    goalSection: thread.goalSection,
                    orgSection: thread.orgSection,
                    successSection: thread.successSection,
                    activitySection: thread.activitySection,
                  }}
                  managerName={managerName}
                  role={role}
                  hideGoalActionButtons
                />
              </div>

              <section className="space-y-3 rounded-lg border bg-card p-4 overflow-hidden">
                <div>
                  <h3 className="text-base font-semibold">具体工作进度</h3>
                  <p className="text-sm text-muted-foreground">当前关键场景：{scenarioDisplayName}</p>
                </div>
                <PlanProgressModule executionSection={thread.executionSection} />
              </section>
            </div>
          </div>
        ) : null}

        {tab === "activity-add" ? (
          <ActivityAddModule
            threadId={thread.id}
            executionSection={thread.executionSection}
            managerName={managerName}
            role={role}
          />
        ) : null}

        {tab === "weekly" ? (
          <section className="rounded-lg border bg-card p-6">
            <h3 className="text-base font-semibold">周报生成</h3>
            <p className="mt-2 text-sm text-muted-foreground">后续设计中。</p>
          </section>
        ) : null}
      </section>
    </div>
  );
}
