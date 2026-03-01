"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { buildThreadExecutionSummary } from "@/lib/execution-progress";
import { createWeeklyReport } from "@/lib/repos/weekly-report-repo";
import { listThreadsByCustomerIds } from "@/lib/repos/thread-repo";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import {
  createWeeklyReportSchema,
  generateWeeklyReportFromExecutionSchema,
} from "@/lib/validators/weekly-report";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export async function createWeeklyReportAction(formData: FormData) {
  const parsed = createWeeklyReportSchema.safeParse({
    role: formData.get("role"),
    managerName: formData.get("managerName"),
    customerId: formData.get("customerId"),
    ownerName: formData.get("ownerName"),
    weekStart: formData.get("weekStart"),
    weekEnd: formData.get("weekEnd"),
    summary: formData.get("summary"),
    risks: formData.get("risks"),
    nextWeekPlan: formData.get("nextWeekPlan"),
    needSupport: formData.get("needSupport"),
    threadIds: formData.getAll("threadIds"),
    weeklyObjectives: formData.get("weeklyObjectives"),
    plannedExecutionJson: formData.get("plannedExecutionJson"),
    executedItemsJson: formData.get("executedItemsJson"),
    requiredNextActionsJson: formData.get("requiredNextActionsJson"),
    deliveryBreakthroughRiskResult: formData.get("deliveryBreakthroughRiskResult"),
    deliveryBreakthroughRiskComment: formData.get("deliveryBreakthroughRiskComment"),
    keyStakeholderRecognitionResult: formData.get("keyStakeholderRecognitionResult"),
    keyStakeholderRecognitionComment: formData.get("keyStakeholderRecognitionComment"),
    satisfactionRiskLevel: formData.get("satisfactionRiskLevel"),
    satisfactionRiskReason: formData.get("satisfactionRiskReason"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "创建周报失败");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  if (!isSupervisorRole(role) && managerName) {
    const customerIds = await listCustomerIdsByManager(managerName);
    if (!customerIds.includes(parsed.data.customerId)) {
      throw new Error("当前经理不可为该客户创建周报");
    }
  }

  const report = await createWeeklyReport({
    ...parsed.data,
    threadIds: [...new Set(parsed.data.threadIds)],
  });

  revalidatePath("/weekly-reports");
  revalidatePath("/threads");
  revalidatePath("/dashboard");
  redirect(`/weekly-reports/${report.id}`);
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

  revalidatePath("/weekly-reports");
  revalidatePath("/threads");
  revalidatePath("/dashboard");
  redirect(`/weekly-reports/${report.id}`);
}
