"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createThread, updateThreadMeta, updateThreadSection } from "@/lib/repos/thread-repo";
import { getCustomerById, getOrCreateCustomerByName } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import {
  createThreadSchema,
  createThreadWorkflowSchema,
  updateThreadMetaSchema,
  updateThreadSectionSchema,
} from "@/lib/validators/thread";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export async function createThreadAction(formData: FormData) {
  const parsed = createThreadSchema.safeParse({
    role: formData.get("role"),
    managerName: formData.get("managerName"),
    customerId: formData.get("customerId"),
    customerName: formData.get("customerName"),
    keyPerson: formData.get("keyPerson"),
    keyPersonDept: formData.get("keyPersonDept"),
    keyProjectScenario: formData.get("keyProjectScenario"),
    productLine: formData.get("productLine"),
    ownerName: formData.get("ownerName"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "创建关键场景失败");
  }

  const selectedCustomer =
    parsed.data.customerId && parsed.data.customerId.trim()
      ? await getCustomerById(parsed.data.customerId)
      : null;

  const customer =
    selectedCustomer ||
    (parsed.data.customerName
      ? await getOrCreateCustomerByName(parsed.data.customerName)
      : null);

  if (!customer) {
    throw new Error("客户必填");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  if (!isSupervisorRole(role) && managerName) {
    const allowedCustomerIds = await listCustomerIdsByManager(managerName);
    if (!allowedCustomerIds.includes(customer.id)) {
      throw new Error("当前经理不可创建该客户的关键场景");
    }
  }

  const thread = await createThread({
    customer: customer.name,
    customerRecord: {
      connect: { id: customer.id },
    },
    keyPerson: parsed.data.keyPerson,
    keyPersonDept: parsed.data.keyPersonDept || null,
    keyProjectScenario: parsed.data.keyProjectScenario,
    productLine: parsed.data.productLine || null,
    ownerName: parsed.data.ownerName,
    stage: "BASIC_INFO",
    stageStatus: "IN_PROGRESS",
    riskLevel: "GREEN",
  });

  revalidatePath("/threads");
  revalidatePath("/dashboard");
  redirect(`/threads/${thread.id}`);
}

export async function createThreadWorkflowAction(formData: FormData) {
  const parsed = createThreadWorkflowSchema.safeParse({
    role: formData.get("role"),
    managerName: formData.get("managerName"),
    customerId: formData.get("customerId"),
    ownerName: formData.get("ownerName"),
    projectScenario: formData.get("projectScenario"),
    productLine: formData.get("productLine"),
    keyScenarioDescription: formData.get("keyScenarioDescription"),
    targetDimension: formData.get("targetDimension"),
    targetDescription: formData.get("targetDescription"),
    businessStage: formData.get("businessStage"),
    businessGoalAchieved: formData.get("businessGoalAchieved"),
    orgCurrentState: formData.get("orgCurrentState"),
    orgChanges: formData.get("orgChanges"),
    stakeholdersJson: formData.get("stakeholdersJson"),
    businessNeedAnalysis: formData.get("businessNeedAnalysis"),
    personalNeeds: formData.get("personalNeeds"),
    smartGoal: formData.get("smartGoal"),
    alignedWithCustomer: formData.get("alignedWithCustomer"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "创建客户成功计划失败");
  }

  let stakeholders: Array<{
    name?: string;
    department?: string;
    level?: string;
    description?: string;
    currentState?: string;
    target?: string;
    acceptanceCriteria?: string;
    changeAnalysis?: string;
  }> = [];
  try {
    const raw = JSON.parse(parsed.data.stakeholdersJson);
    if (Array.isArray(raw)) {
      stakeholders = raw;
    }
  } catch {
    throw new Error("关键人条目格式不正确");
  }
  const normalizedStakeholders = stakeholders
    .map((item) => ({
      name: item.name?.trim() || "",
      department: item.department?.trim() || "",
      level: item.level?.trim() || "",
      description: item.description?.trim() || "",
      currentState: item.currentState?.trim() || "",
      target: item.target?.trim() || "",
      acceptanceCriteria: item.acceptanceCriteria?.trim() || "",
      changeAnalysis: item.changeAnalysis?.trim() || "",
    }))
    .filter((item) => item.name);
  if (!normalizedStakeholders.length) {
    throw new Error("至少需要填写 1 位关键人");
  }

  const customer = await getCustomerById(parsed.data.customerId);
  if (!customer) {
    throw new Error("客户不存在或已失效");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  if (!isSupervisorRole(role) && managerName) {
    const allowedCustomerIds = await listCustomerIdsByManager(managerName);
    if (!allowedCustomerIds.includes(customer.id)) {
      throw new Error("当前经理不可创建该客户的客户成功计划");
    }
  }

  const attachments = formData
    .getAll("attachments")
    .filter((item): item is File => item instanceof File && item.size > 0)
    .map((file) => ({
      fileName: file.name,
      size: file.size,
      type: file.type,
    }));

  const thread = await createThread({
    customer: customer.name,
    customerRecord: {
      connect: { id: customer.id },
    },
    keyPerson: normalizedStakeholders[0].name,
    keyPersonDept: normalizedStakeholders[0].department || null,
    keyProjectScenario: parsed.data.projectScenario,
    productLine: parsed.data.productLine || null,
    ownerName: parsed.data.ownerName,
    stage: "BASIC_INFO",
    stageStatus: "IN_PROGRESS",
    riskLevel: "GREEN",
    goalSection: {
      module: "经营目标-扩大收入",
      targetDimension: parsed.data.targetDimension,
      targetDescription: parsed.data.targetDescription,
      businessStage: parsed.data.businessStage,
      businessGoalAchieved: parsed.data.businessGoalAchieved === "YES",
    },
    orgSection: {
      module: "客户成功-组织关系",
      orgCurrentState: parsed.data.orgCurrentState,
      orgChanges: parsed.data.orgChanges,
      stakeholders: normalizedStakeholders,
    },
    successSection: {
      module: "客户成功-价值兑现",
      businessNeedAnalysis: parsed.data.businessNeedAnalysis,
      personalNeeds: parsed.data.personalNeeds,
      smartGoal: parsed.data.smartGoal,
      alignedWithCustomer: parsed.data.alignedWithCustomer === "YES",
      attachments,
    },
    activitySection: {
      module: "基本信息",
      keyScenarioDescription: parsed.data.keyScenarioDescription,
    },
  });

  revalidatePath("/threads");
  revalidatePath("/dashboard");
  const query = new URLSearchParams({
    scenarioId: thread.id,
    ...(managerName ? { managerName } : {}),
    ...(parsed.data.role ? { role: parsed.data.role } : {}),
  }).toString();
  redirect(`/threads/customers/${customer.id}?${query}`);
}

export async function updateThreadMetaAction(formData: FormData) {
  const parsed = updateThreadMetaSchema.safeParse({
    id: formData.get("id"),
    stage: formData.get("stage"),
    stageStatus: formData.get("stageStatus"),
    riskLevel: formData.get("riskLevel"),
    nextAction: formData.get("nextAction"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新关键场景状态失败");
  }

  await updateThreadMeta(parsed.data.id, parsed.data);
  revalidatePath(`/threads/${parsed.data.id}`);
  revalidatePath("/threads");
}

export async function updateThreadSectionAction(formData: FormData) {
  const parsed = updateThreadSectionSchema.safeParse({
    id: formData.get("id"),
    section: formData.get("section"),
    sectionJson: formData.get("sectionJson"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新阶段内容失败");
  }

  let payload: unknown;
  try {
    payload = JSON.parse(parsed.data.sectionJson);
  } catch {
    throw new Error("JSON 格式不正确");
  }

  await updateThreadSection(parsed.data.id, parsed.data.section, payload as never);
  revalidatePath(`/threads/${parsed.data.id}`);
}
