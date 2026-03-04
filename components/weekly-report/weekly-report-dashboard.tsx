import { formatDateCST } from "@/lib/datetime";
import { executionStatusLabelMap, toArray, toText, weeklyRiskLabelMap } from "@/lib/weekly-report-view";

type ReportRow = {
  id: string;
  customerName: string;
  ownerName: string;
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  threadCount: number;
  satisfactionRiskLevel?: string | null;
  plannedExecutionItems?: unknown;
  executedItems?: unknown;
  requiredNextActions?: unknown;
  nextWeekPlan?: string | null;
};

const GOAL_LABELS = ["经营目标-扩大收入", "客户成功-组织关系", "客户成功-价值兑现"] as const;

function toTs(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getPriorityWeight(value: string) {
  if (value === "P1") return 1;
  if (value === "P2") return 2;
  if (value === "P3") return 3;
  return 4;
}

export function WeeklyReportDashboard({ rows }: { rows: ReportRow[] }) {
  const reports = rows;
  const plannedItems = reports.flatMap((item) => toArray(item.plannedExecutionItems));
  const executedItems = reports.flatMap((item) => toArray(item.executedItems));
  const requiredActions = reports.flatMap((item) =>
    toArray(item.requiredNextActions).map((action) => ({
      action,
      reportWeekEnd: item.weekEnd,
    })),
  );
  const doneCount = executedItems.filter((item) => toText(item.status) === "DONE").length;
  const blockedCount = executedItems.filter((item) => toText(item.status) === "BLOCKED").length;
  const totalExecutionCount = executedItems.length;
  const executionDoneRate = totalExecutionCount ? Math.round((doneCount / totalExecutionCount) * 100) : 0;
  const blockedClearRate = totalExecutionCount ? Math.max(0, 100 - Math.round((blockedCount / totalExecutionCount) * 100)) : 100;
  const coveredReportRate = reports.length
    ? Math.round((reports.filter((item) => item.threadCount > 0).length / reports.length) * 100)
    : 0;

  const highRiskCount = reports.filter((item) => item.satisfactionRiskLevel === "HIGH_RED").length;
  const mediumRiskCount = reports.filter((item) => item.satisfactionRiskLevel === "MEDIUM_YELLOW").length;
  const lowRiskCount = reports.filter((item) => item.satisfactionRiskLevel === "LOW_GREEN").length;

  const overdueActions = requiredActions.filter(({ action, reportWeekEnd }) => {
    const deadline = toText(action.deadline) || toText(action.dueDate) || toText(action.expectedCloseAt);
    if (!deadline) return false;
    return toTs(deadline) > 0 && toTs(deadline) < reportWeekEnd.getTime();
  });
  const pendingPlanReports = reports.filter((item) => !toText(item.nextWeekPlan)).length;
  const topActions = requiredActions
    .map(({ action }) => action)
    .filter((item) => toText(item.title))
    .sort((a, b) => {
      const p = getPriorityWeight(toText(a.priority)) - getPriorityWeight(toText(b.priority));
      if (p !== 0) return p;
      return toTs(toText(a.deadline)) - toTs(toText(b.deadline));
    })
    .slice(0, 3);

  const goalCards = GOAL_LABELS.map((goalLabel) => {
    const goalPlanned = plannedItems.filter((item) => toText(item.linkedGoal) === goalLabel);
    const goalDone = goalPlanned.filter((item) => toText(item.status) === "DONE").length;
    const goalBlocked = goalPlanned.filter((item) => toText(item.status) === "BLOCKED").length;
    const riskTone = goalBlocked > 0 ? "中风险" : "低风险";
    return {
      goalLabel,
      actionCount: goalPlanned.length,
      doneCount: goalDone,
      riskTone,
    };
  });

  return (
    <section className="space-y-3 rounded-lg border bg-card p-3">
      <div className="grid gap-3 xl:grid-cols-3">
        <div className="rounded-md border p-3">
          <h3 className="text-sm font-semibold">本周目标达成</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p>动作完成率：{executionDoneRate}%</p>
            <p>阻塞清零率：{blockedClearRate}%</p>
            <p>关键场景覆盖率：{coveredReportRate}%</p>
          </div>
        </div>
        <div className="rounded-md border p-3">
          <h3 className="text-sm font-semibold">风险与阻塞</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p>高风险周报：{highRiskCount}</p>
            <p>中风险周报：{mediumRiskCount}</p>
            <p>低风险周报：{lowRiskCount}</p>
            <p>执行阻塞项：{blockedCount}</p>
          </div>
        </div>
        <div className="rounded-md border p-3">
          <h3 className="text-sm font-semibold">下周关键动作Top3</h3>
          <div className="mt-2 space-y-2 text-sm">
            {topActions.length ? (
              topActions.map((item, index) => (
                <p key={`top-action-${index}`}>
                  {index + 1}. {toText(item.title)}{toText(item.deadline) ? `（截止 ${formatDateCST(toText(item.deadline))}）` : ""}
                </p>
              ))
            ) : (
              <p className="text-muted-foreground">暂无下周关键动作</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[72%_28%]">
        <div className="rounded-md border p-3">
          <h3 className="text-sm font-semibold">三大目标执行卡片</h3>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            {goalCards.map((goal) => (
              <article key={goal.goalLabel} className="rounded-md border bg-muted/20 p-2">
                <p className="text-sm font-medium">{goal.goalLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">本周动作：{goal.actionCount} 项</p>
                <p className="text-xs text-muted-foreground">执行结果：完成 {goal.doneCount} 项</p>
                <p className="mt-1 text-xs">当前风险：{goal.riskTone}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="rounded-md border p-3">
          <h3 className="text-sm font-semibold">提醒中心</h3>
          <div className="mt-2 space-y-2 text-sm">
            <p>逾期提醒：{overdueActions.length} 条动作已超期</p>
            <p>待完善提醒：{pendingPlanReports} 份周报未填写下周计划</p>
            <p>风险升级提醒：{highRiskCount} 份周报处于{weeklyRiskLabelMap.HIGH_RED}</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border p-3">
        <h3 className="text-sm font-semibold">执行动作明细（按逾期优先）</h3>
        <div className="mt-2 space-y-2">
          {reports
            .flatMap((report) =>
              toArray(report.executedItems).map((item) => ({
                title: toText(item.title) || toText(item.executionItemId) || "未命名动作",
                owner: toText(item.owner) || "-",
                status: executionStatusLabelMap[toText(item.status)] || "待执行",
                deadline: toText(item.deadline) || toText(item.expectedCloseAt),
                reportWeekEndTs: report.weekEnd.getTime(),
              })),
            )
            .sort((a, b) => {
              const aOverdue = a.deadline && toTs(a.deadline) < a.reportWeekEndTs ? 1 : 0;
              const bOverdue = b.deadline && toTs(b.deadline) < b.reportWeekEndTs ? 1 : 0;
              if (aOverdue !== bOverdue) return bOverdue - aOverdue;
              return toTs(a.deadline) - toTs(b.deadline);
            })
            .slice(0, 8)
            .map((item, index) => (
              <div key={`exec-item-${index}`} className="grid grid-cols-[minmax(0,1fr)_120px_100px_120px] gap-2 rounded border px-2 py-1 text-xs">
                <span>{item.title}</span>
                <span>{item.owner}</span>
                <span>{item.status}</span>
                <span>{item.deadline ? formatDateCST(item.deadline) : "-"}</span>
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
