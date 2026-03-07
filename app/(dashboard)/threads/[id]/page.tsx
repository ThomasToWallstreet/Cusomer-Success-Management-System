import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { ThreadDetailEditForm } from "@/components/thread/thread-detail-edit-form";
import { ThreadDetailReadonly } from "@/components/thread/thread-detail-readonly";
import { ThreadStepper } from "@/components/thread/thread-stepper";
import { Button } from "@/components/ui/button";
import { WeeklyGenerator } from "@/components/weekly-report/weekly-generator";
import { getThreadDetail } from "@/lib/repos/thread-repo";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
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
  const tab = (getOne(query.tab) || "plan") === "execution" ? "plan" : getOne(query.tab) || "plan";
  const mode = getOne(query.mode) || "view";
  const thread = await getThreadDetail(id);
  if (!thread) notFound();

  const tabLink = (nextTab: "plan" | "weekly", nextMode?: "view" | "edit") =>
    `/threads/${thread.id}?${new URLSearchParams({
      tab: nextTab,
      mode: nextMode || mode,
      ...(getOne(query.managerName) ? { managerName: String(getOne(query.managerName)) } : {}),
      ...(getOne(query.role) ? { role: String(getOne(query.role)) } : {}),
    }).toString()}`;

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
            <div className="flex gap-2">
              {mode === "edit" ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={tabLink("plan", "view")}>返回查看</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" asChild>
                  <Link href={tabLink("plan", "edit")}>编辑计划</Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>

        {tab === "plan" ? (
          mode === "edit" ? (
            <ThreadDetailEditForm
              thread={{
                id: thread.id,
                keyProjectScenario: thread.keyProjectScenario,
                productLine: thread.productLine,
                goalSection: thread.goalSection,
                orgSection: thread.orgSection,
                successSection: thread.successSection,
                activitySection: thread.activitySection,
                executionSection: thread.executionSection,
              }}
            />
          ) : (
            <ThreadDetailReadonly
              thread={{
                keyProjectScenario: thread.keyProjectScenario,
                productLine: thread.productLine,
                goalSection: thread.goalSection,
                orgSection: thread.orgSection,
                successSection: thread.successSection,
                activitySection: thread.activitySection,
              }}
            />
          )
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
