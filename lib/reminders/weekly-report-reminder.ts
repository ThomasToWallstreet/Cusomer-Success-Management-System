import { listWeeklyReports } from "@/lib/repos/weekly-report-repo";
import { toArray, toText } from "@/lib/weekly-report-view";

export type WeeklyReminder = {
  key: string;
  type: "OVERDUE_ACTION" | "HIGH_RISK_REPORT" | "MISSING_NEXT_PLAN";
  reportId: string;
  customerName: string;
  ownerName: string;
  message: string;
};

function toTs(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export async function scanWeeklyReportReminders() {
  const reports = await listWeeklyReports();
  const nowTs = Date.now();
  const reminderMap = new Map<string, WeeklyReminder>();

  for (const report of reports) {
    const customerName = report.customerRecord?.name || "-";
    const ownerName = report.ownerName;
    const requiredActions = toArray(report.requiredNextActions);

    if (!toText(report.nextWeekPlan)) {
      const key = `missing-next-plan:${report.id}`;
      reminderMap.set(key, {
        key,
        type: "MISSING_NEXT_PLAN",
        reportId: report.id,
        customerName,
        ownerName,
        message: `周报未填写下周计划：${customerName} / ${ownerName}`,
      });
    }

    if (report.satisfactionRiskLevel === "HIGH_RED") {
      const key = `high-risk:${report.id}`;
      reminderMap.set(key, {
        key,
        type: "HIGH_RISK_REPORT",
        reportId: report.id,
        customerName,
        ownerName,
        message: `高风险周报需优先关注：${customerName} / ${ownerName}`,
      });
    }

    for (const action of requiredActions) {
      const deadline = toText(action.deadline) || toText(action.dueDate) || toText(action.expectedCloseAt);
      if (!deadline || toTs(deadline) === 0 || toTs(deadline) >= nowTs) continue;
      const title = toText(action.title) || "未命名动作";
      const key = `overdue-action:${report.id}:${title}:${deadline}`;
      reminderMap.set(key, {
        key,
        type: "OVERDUE_ACTION",
        reportId: report.id,
        customerName,
        ownerName,
        message: `动作已超期：${customerName} / ${ownerName} / ${title}（截止 ${deadline}）`,
      });
    }
  }

  return [...reminderMap.values()];
}

export function buildReminderMarkdown(reminders: WeeklyReminder[]) {
  const lines = [
    "## 周报提醒扫描结果",
    `提醒总数：**${reminders.length}**`,
    "",
  ];
  reminders.slice(0, 20).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.message}`);
  });
  if (reminders.length > 20) {
    lines.push(`... 其余 ${reminders.length - 20} 条请进入系统查看`);
  }
  return lines.join("\n");
}
