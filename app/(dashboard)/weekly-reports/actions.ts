"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildThreadExecutionSummary } from "@/lib/execution-progress";
import { createWeeklyReport, deleteWeeklyReport, getWeeklyReportDetail, updateWeeklyReport } from "@/lib/repos/weekly-report-repo";
import { captureWeeklyReportActionSnapshot, createExecutionActionEvent, updateExecutionActionStatus } from "@/lib/repos/execution-action-repo";
import { listThreadsByCustomerIds } from "@/lib/repos/thread-repo";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import {
  deleteWeeklyReportSchema,
  generateWeeklyReportFromExecutionSchema,
  updateWeeklyReportSchema,
} from "@/lib/validators/weekly-report";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export async function createWeeklyReportAction(formData: FormData) {
  // 周报创建已收敛为“执行推进自动生成”单入口，保留该 action 仅用于兼容旧入口。
  // 若用户仍命中旧入口，直接回到周报列表并提示使用自动生成。
  void formData;
  throw new Error("周报已改为执行推进自动生成，请在客户成功计划详情页的“周报生成”中操作");
}

export async function generateWeeklyReportFromExecutionAction(formData: FormData) {
  const parsed = generateWeeklyReportFromExecutionSchema.safeParse({
    role: formData.get("role"),
    managerName: formData.get("managerName"),
    customerId: formData.get("customerId"),
    ownerName: formData.get("ownerName"),
    weekStart: formData.get("weekStart"),
    weekEnd: formData.get("weekEnd"),
    threadIds: formData.getAll("threadIds"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "生成周报失败");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  if (!isSupervisorRole(role) && managerName) {
    const customerIds = await listCustomerIdsByManager(managerName);
    if (!customerIds.includes(parsed.data.customerId)) {
      throw new Error("当前经理不可为该客户生成周报");
    }
  }

  const selectedThreadIds = [...new Set(parsed.data.threadIds)];
  const threads = await listThreadsByCustomerIds([parsed.data.customerId]);
  const selectedThreads = threads.filter((item) => selectedThreadIds.includes(item.id));
  if (selectedThreads.length !== selectedThreadIds.length) {
    throw new Error("存在不属于当前客户的关键场景，无法生成周报");
  }

  const selectedSummaries = selectedThreads
    .map((thread) =>
      buildThreadExecutionSummary({
        threadId: thread.id,
        customerName: thread.customer,
        scenarioName: thread.keyProjectScenario,
        ownerName: thread.ownerName,
        executionSection: thread.executionSection,
      }),
    )
    .filter((item) => item.hasRecord);
  if (!selectedSummaries.length) {
    throw new Error("无可用执行推进记录");
  }

  const mergedItems = selectedSummaries.flatMap((item) => item.items);
  const plannedExecutionItems = mergedItems.map((item, index) => ({
    id: `gen-plan-${index + 1}`,
    type: item.source === "HEADQUARTERS" ? "GOAL_DERIVED" : "KCP",
    title: item.itemTitle,
    linkedGoal: item.goalLabel,
    owner: item.ownerName || parsed.data.ownerName,
    status: item.status,
  }));
  const executedItems = mergedItems.map((item, index) => ({
    executionItemId: `gen-plan-${index + 1}`,
    title: item.itemTitle,
    status: item.status,
    resultSummary: `${item.customerName}-${item.scenarioName}：${item.note || "已记录执行推进信息"}`,
    evidence: item.closedAt || "",
    blockedReason: item.status === "BLOCKED" ? item.note || "需持续跟进" : "",
  }));
  const requiredNextActions = mergedItems
    .filter((item) => item.status !== "DONE")
    .map((item) => ({
      title: `${item.scenarioName}-${item.itemTitle}`,
      source: "执行推进自动生成",
      priority: item.status === "BLOCKED" ? "P1" : "P2",
    }));

  const blockedCount = mergedItems.filter((item) => item.status === "BLOCKED").length;
  const riskLevel = blockedCount > 0 ? "MEDIUM_YELLOW" : "LOW_GREEN";
  const summary = `基于执行推进自动生成：覆盖${selectedSummaries.length}个关键场景，汇总${mergedItems.length}条执行事项。`;
  const scenarioNames = selectedThreads.map((item) => item.keyProjectScenario).join("、");
  const weeklyObjectives = `聚焦关键场景执行推进：${scenarioNames}`;

  const report = await createWeeklyReport({
    customerId: parsed.data.customerId,
    ownerName: parsed.data.ownerName,
    weekStart: parsed.data.weekStart,
    weekEnd: parsed.data.weekEnd,
    threadIds: selectedThreadIds,
    summary,
    weeklyObjectives,
    plannedExecutionJson: JSON.stringify(plannedExecutionItems, null, 2),
    executedItemsJson: JSON.stringify(executedItems, null, 2),
    requiredNextActionsJson: JSON.stringify(requiredNextActions, null, 2),
    deliveryBreakthroughRiskResult: "NO_CHANGE",
    deliveryBreakthroughRiskComment: "基于执行推进记录自动生成，待经理补充判断。",
    keyStakeholderRecognitionResult: "PENDING_CONFIRMATION",
    keyStakeholderRecognitionComment: "基于执行推进记录自动生成，待经理补充关键人反馈。",
    satisfactionRiskLevel: riskLevel,
    satisfactionRiskReason: blockedCount > 0 ? "存在阻塞事项，建议优先推进闭环。" : "执行推进总体可控。",
    risks: blockedCount > 0 ? `阻塞事项${blockedCount}条，需重点关注。` : "",
    needSupport: "",
    nextWeekPlan: "",
  });
  await captureWeeklyReportActionSnapshot(report.id, selectedThreads.map((item) => item.id));

  revalidatePath("/weekly-reports");
  revalidatePath("/threads");
  revalidatePath("/dashboard");
  const editQuery = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
  }).toString();
  redirect(editQuery ? `/weekly-reports/${report.id}/edit?${editQuery}` : `/weekly-reports/${report.id}/edit`);
}

export async function deleteWeeklyReportAction(formData: FormData) {
  const parsed = deleteWeeklyReportSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
    managerName: formData.get("managerName"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "删除周报失败");
  }

  const report = await getWeeklyReportDetail(parsed.data.id);
  if (!report) {
    throw new Error("周报不存在或已删除");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  if (!isSupervisorRole(role)) {
    if (!managerName || managerName === "ALL") {
      throw new Error("当前经理身份无效，无法删除周报");
    }
    if (report.ownerName !== managerName) {
      throw new Error("当前经理仅可删除本人周报");
    }
  }

  await deleteWeeklyReport(parsed.data.id);

  revalidatePath("/weekly-reports");
  revalidatePath("/dashboard");
  revalidatePath("/threads");
}

export async function updateWeeklyReportAction(formData: FormData) {
  const parsed = updateWeeklyReportSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
    managerName: formData.get("managerName"),
    weeklyObjectives: formData.get("weeklyObjectives"),
    summary: formData.get("summary"),
    risks: formData.get("risks"),
    nextWeekPlan: formData.get("nextWeekPlan"),
    needSupport: formData.get("needSupport"),
    deliveryBreakthroughRiskResult: formData.get("deliveryBreakthroughRiskResult"),
    deliveryBreakthroughRiskComment: formData.get("deliveryBreakthroughRiskComment"),
    keyStakeholderRecognitionResult: formData.get("keyStakeholderRecognitionResult"),
    keyStakeholderRecognitionComment: formData.get("keyStakeholderRecognitionComment"),
    satisfactionRiskLevel: formData.get("satisfactionRiskLevel"),
    satisfactionRiskReason: formData.get("satisfactionRiskReason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新周报失败");
  }

  const report = await getWeeklyReportDetail(parsed.data.id);
  if (!report) {
    throw new Error("周报不存在或已删除");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  if (!isSupervisorRole(role)) {
    if (!managerName || managerName === "ALL") {
      throw new Error("当前经理身份无效，无法编辑周报");
    }
    if (report.ownerName !== managerName) {
      throw new Error("当前经理仅可编辑本人周报");
    }
  }

  await updateWeeklyReport(parsed.data.id, parsed.data);

  revalidatePath("/weekly-reports");
  revalidatePath(`/weekly-reports/${parsed.data.id}`);
  revalidatePath(`/weekly-reports/${parsed.data.id}/edit`);
  revalidatePath("/dashboard");
  redirect(`/weekly-reports/${parsed.data.id}`);
}

export async function updateWeeklyActionStatusQuickAction(formData: FormData) {
  const weeklyReportId = String(formData.get("weeklyReportId") || "").trim();
  const actionId = String(formData.get("actionId") || "").trim();
  const nextStatus = String(formData.get("nextStatus") || "").trim() as "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";
  const managerName = String(formData.get("managerName") || "").trim();
  const roleRaw = String(formData.get("role") || "").trim();

  if (!weeklyReportId || !actionId) {
    throw new Error("快捷更新参数缺失");
  }
  if (!["TODO", "IN_PROGRESS", "DONE", "BLOCKED"].includes(nextStatus)) {
    throw new Error("状态值不合法");
  }
  const report = await getWeeklyReportDetail(weeklyReportId);
  if (!report) {
    throw new Error("周报不存在或已删除");
  }
  const role = parseViewerRole(roleRaw);
  if (!isSupervisorRole(role)) {
    if (!managerName || managerName === "ALL") {
      throw new Error("当前经理身份无效，无法快捷更新");
    }
    if (report.ownerName !== managerName) {
      throw new Error("当前经理仅可更新本人周报动作");
    }
  }

  const action = await updateExecutionActionStatus(actionId, nextStatus);
  await createExecutionActionEvent({
    actionId: action.id,
    eventType: "STATUS_CHANGED",
    beforeValue: {},
    afterValue: { status: nextStatus, via: "weekly-quick" },
    changedBy: managerName || roleRaw || "unknown",
    source: "UI_WEEKLY_QUICK",
  });

  revalidatePath(`/weekly-reports/${weeklyReportId}`);
  revalidatePath("/weekly-reports");
  revalidatePath("/threads");
}
