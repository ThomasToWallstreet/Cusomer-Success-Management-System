import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ExecutionWorkbench } from "@/components/thread/execution-workbench";
import { ThreadDetailReadonly } from "@/components/thread/thread-detail-readonly";
import { ThreadStepper } from "@/components/thread/thread-stepper";
import { Button } from "@/components/ui/button";
import { WeeklyGenerator } from "@/components/weekly-report/weekly-generator";
import { getThreadDetail } from "@/lib/repos/thread-repo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
  const tab = getOne(query.tab) === "weekly" ? "weekly" : "plan";
  const panel = getOne(query.panel) === "execution" ? "execution" : "readonly";
  const savedAction = getOne(query.savedAction) || "";
  const thread = await getThreadDetail(id);
  if (!thread) notFound();

  const activity = toRecord(thread.activitySection);
  const success = toRecord(thread.successSection);
  const scenarioDisplayName =
    toText(toRecord(activity.scenarioMasterSnapshot).name) ||
    toText(toRecord(success.scenarioMasterSnapshot).name) ||
    thread.keyProjectScenario;

  const tabLink = (nextTab: "plan" | "weekly", nextPanel?: "readonly" | "execution") => {
    const params = new URLSearchParams({
      tab: nextTab,
      ...(getOne(query.managerName) ? { managerName: String(getOne(query.managerName)) } : {}),
      ...(getOne(query.role) ? { role: String(getOne(query.role)) } : {}),
    });
    if (nextTab === "plan" && nextPanel === "execution") {
      params.set("panel", "execution");
    }
    return `/threads/${thread.id}?${params.toString()}`;
  };

  const backHref =
    thread.customerId
      ? `/threads/customers/${thread.customerId}?${new URLSearchParams({
          scenarioId: thread.id,
          ...(getOne(query.managerName) ? { managerName: String(getOne(query.managerName)) } : {}),
          ...(getOne(query.role) ? { role: String(getOne(query.role)) } : {}),
        }).toString()}`
      : (getOne(query.managerName) || getOne(query.role))
        ? `/threads?${new URLSearchParams({
            ...(getOne(query.managerName) ? { managerName: String(getOne(query.managerName)) } : {}),
            ...(getOne(query.role) ? { role: String(getOne(query.role)) } : {}),
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

      <ThreadStepper
        id={thread.id}
        stage={thread.stage}
        stageStatus={thread.stageStatus}
        riskLevel={thread.riskLevel}
        nextAction={thread.nextAction}
      />

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button variant={tab === "plan" ? "default" : "outline"} size="sm" asChild>
              <Link href={tabLink("plan")}>计划详情</Link>
            </Button>
            <Button variant={tab === "weekly" ? "default" : "outline"} size="sm" asChild>
              <Link href={tabLink("weekly")}>周报生成</Link>
            </Button>
          </div>
          {tab === "plan" ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={panel === "execution" ? tabLink("plan") : tabLink("plan", "execution")}>
                {panel === "execution" ? "收起执行动作" : "新增执行动作"}
              </Link>
            </Button>
          ) : null}
        </div>

        {tab === "plan" ? (
          <div className="space-y-3">
            {savedAction === "save_execution" ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                保存完成
              </div>
            ) : null}

            <div className={cn("grid gap-4", panel === "execution" ? "xl:grid-cols-[minmax(0,1fr)_480px]" : "")}>
              <div className="space-y-3">
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  客户成功计划详情不允许在当前页面修改。如需修改计划，请到客户管理界面编辑相关主数据。
                </div>
                <ThreadDetailReadonly
                  thread={{
                    keyProjectScenario: scenarioDisplayName,
                    productLine: thread.productLine,
                    goalSection: thread.goalSection,
                    orgSection: thread.orgSection,
                    successSection: thread.successSection,
                    activitySection: thread.activitySection,
                  }}
                />
              </div>

              {panel === "execution" ? (
                <section className="space-y-3 rounded-lg border bg-card p-4">
                  <div>
                    <h3 className="text-base font-semibold">新增执行动作</h3>
                    <p className="text-sm text-muted-foreground">当前关键场景：{scenarioDisplayName}</p>
                  </div>
                  <ExecutionWorkbench threadId={thread.id} executionSection={thread.executionSection} />
                </section>
              ) : null}
            </div>
          </div>
        ) : null}

        {tab === "weekly" ? (
          <WeeklyGenerator
            threadId={thread.id}
            defaultCustomerId={thread.customerId}
            defaultOwnerName={thread.ownerName}
            managerName={getOne(query.managerName)}
            role={getOne(query.role)}
            selectedCustomerId={getOne(query.weeklyCustomerId)}
            selectedOwnerName={getOne(query.weeklyOwnerName)}
          />
        ) : null}
      </section>
    </div>
  );
}
