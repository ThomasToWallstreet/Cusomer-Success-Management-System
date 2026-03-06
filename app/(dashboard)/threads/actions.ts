"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createThread,
  deleteThread,
  getThreadDetail,
  updateThreadMeta,
  updateThreadOverview,
  updateThreadSection,
} from "@/lib/repos/thread-repo";
import { getCustomerById, getOrCreateCustomerByName } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import {
  getCustomerContactById,
} from "@/lib/repos/customer-contact-repo";
import { getCustomerProjectItemById } from "@/lib/repos/customer-project-repo";
import { getCustomerScenarioItemById } from "@/lib/repos/customer-scenario-repo";
import {
  createThreadSchema,
  createThreadWorkflowSchema,
  deleteThreadSchema,
  updateThreadMetaSchema,
  updateThreadPlanSchema,
  updateThreadSectionSchema,
} from "@/lib/validators/thread";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";
import { syncExecutionActionsFromSection } from "@/lib/services/execution-action-service";

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
  const rawContactIds = formData.getAll("contactIds");
  const parsed = createThreadWorkflowSchema.safeParse({
    role: formData.get("role"),
    managerName: formData.get("managerName"),
    customerId: formData.get("customerId"),
    projectItemId: formData.get("projectItemId"),
    contactIds: rawContactIds,
    scenarioItemId: formData.get("scenarioItemId"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "创建客户成功计划失败");
  }

  const normalizedContactIds = [...new Set(parsed.data.contactIds.map((id) => id.trim()).filter(Boolean))];
  if (!normalizedContactIds.length) {
    throw new Error("请至少选择一个关键人");
  }

  const customer = await getCustomerById(parsed.data.customerId);
  if (!customer) {
    throw new Error("客户不存在或已失效");
  }

  const role = parseViewerRole(parsed.data.role);
  const managerName = parsed.data.managerName?.trim();
  const effectiveOwnerName = managerName && managerName !== "ALL" ? managerName : null;
  if (!effectiveOwnerName) {
    throw new Error("负责人信息缺失，请从经理个人页面进入新建");
  }
  if (!isSupervisorRole(role) && managerName) {
    const allowedCustomerIds = await listCustomerIdsByManager(managerName);
    if (!allowedCustomerIds.includes(customer.id)) {
      throw new Error("当前经理不可创建该客户的客户成功计划");
    }
  }

  const projectItem = await getCustomerProjectItemById(parsed.data.projectItemId);
  if (!projectItem || projectItem.customerId !== customer.id) {
    throw new Error("所选项目清单（突破/续费/复购）不存在或不属于当前客户");
  }
  const scenarioItem = await getCustomerScenarioItemById(parsed.data.scenarioItemId);
  if (!scenarioItem || scenarioItem.customerId !== customer.id) {
    throw new Error("所选关键场景清单不存在或不属于当前客户");
  }

  const selectedContacts = (
    await Promise.all(normalizedContactIds.map((contactId) => getCustomerContactById(contactId)))
  ).filter(
    (contact): contact is {
      id: string;
      customerId: string;
      name: string;
      department: string | null;
      level: string | null;
      satisfactionCurrent: string;
      satisfactionTarget: string;
      note: string | null;
    } => Boolean(contact),
  );
  if (selectedContacts.length !== normalizedContactIds.length) {
    throw new Error("所选关键人不存在或已失效");
  }
  if (selectedContacts.some((contact) => contact.customerId !== customer.id)) {
    throw new Error("所选关键人不存在或不属于当前客户");
  }
  const primaryContact = selectedContacts[0];
  const stakeholders = selectedContacts.map((contact) => ({
    name: contact.name,
    department: contact.department || "",
    level: contact.level || "",
    description: "",
    currentState: contact.satisfactionCurrent || "",
    target: contact.satisfactionTarget || "",
    acceptanceCriteria: "",
    changeAnalysis: "",
  }));

  const contactMasterSnapshotList = selectedContacts.map((contact) => ({
    id: contact.id,
    name: contact.name,
    department: contact.department,
    level: contact.level,
    satisfactionCurrent: contact.satisfactionCurrent,
    satisfactionTarget: contact.satisfactionTarget,
    note: contact.note,
  }));

  const thread = await createThread({
    customer: customer.name,
    customerRecord: {
      connect: { id: customer.id },
    },
    projectItem: { connect: { id: projectItem.id } },
    contactRecord: { connect: { id: primaryContact.id } },
    scenarioItem: { connect: { id: scenarioItem.id } },
    keyPerson: selectedContacts.map((item) => item.name).join("、"),
    keyPersonDept: primaryContact.department || null,
    keyProjectScenario: projectItem.name,
    productLine: projectItem.productLine || null,
    ownerName: effectiveOwnerName,
    stage: "BASIC_INFO",
    stageStatus: "IN_PROGRESS",
    riskLevel: "GREEN",
    goalSection: {
      module: "经营目标-扩大收入",
      targetDimension: projectItem.targetDimension,
      targetDescription: projectItem.targetDescription,
      businessStage: projectItem.businessStage,
      businessGoalAchieved: projectItem.businessGoalAchieved,
      businessGoalUpdatedAt: projectItem.businessGoalUpdatedAt,
      businessGoalEvidence: projectItem.businessGoalEvidence,
      projectMasterSnapshot: {
        id: projectItem.id,
        name: projectItem.name,
        productLine: projectItem.productLine,
        targetDimension: projectItem.targetDimension,
        targetDescription: projectItem.targetDescription,
        businessStage: projectItem.businessStage,
        businessGoalAchieved: projectItem.businessGoalAchieved,
        businessGoalUpdatedAt: projectItem.businessGoalUpdatedAt,
        businessGoalEvidence: projectItem.businessGoalEvidence,
      },
    },
    orgSection: {
      module: "客户成功-组织关系",
      stakeholders,
      contactMasterSnapshot: {
        id: primaryContact.id,
        name: primaryContact.name,
        department: primaryContact.department,
        level: primaryContact.level,
        satisfactionCurrent: primaryContact.satisfactionCurrent,
        satisfactionTarget: primaryContact.satisfactionTarget,
      },
      contactMasterSnapshotList,
    },
    successSection: {
      module: "客户成功-价值兑现",
      businessNeedAnalysis: scenarioItem.businessNeedAnalysis,
      personalNeeds: scenarioItem.personalNeeds,
      smartGoal: scenarioItem.smartGoal,
      alignedWithCustomer: scenarioItem.alignedWithCustomer,
      alignedUpdatedAt: scenarioItem.alignedUpdatedAt,
      alignedEvidence: scenarioItem.alignedEvidence,
      scenarioMasterSnapshot: {
        id: scenarioItem.id,
        name: scenarioItem.name,
        businessNeedAnalysis: scenarioItem.businessNeedAnalysis,
        personalNeeds: scenarioItem.personalNeeds,
        smartGoal: scenarioItem.smartGoal,
        alignedWithCustomer: scenarioItem.alignedWithCustomer,
        alignedUpdatedAt: scenarioItem.alignedUpdatedAt,
        alignedEvidence: scenarioItem.alignedEvidence,
      },
    },
    activitySection: {
      module: "基本信息",
      keyScenarioDescription: projectItem.keyScenarioDescription,
      projectMasterSnapshot: {
        id: projectItem.id,
        keyScenarioDescription: projectItem.keyScenarioDescription,
      },
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
  if (parsed.data.section === "executionSection") {
    const thread = await getThreadDetail(parsed.data.id);
    await syncExecutionActionsFromSection({
      threadId: parsed.data.id,
      ownerName: thread?.ownerName || "",
      executionSection: payload,
      changedBy: String(formData.get("changedBy") || "").trim() || undefined,
      source: "UI_EXECUTION",
    });
  }
  revalidatePath(`/threads/${parsed.data.id}`);
  revalidatePath("/threads");

  const submitAction = String(formData.get("submitAction") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "").trim();
  const goalKey = String(formData.get("goalKey") || "").trim();
  if (submitAction) {
    if (redirectTo) {
      try {
        const url = new URL(redirectTo.startsWith("http") ? redirectTo : redirectTo, "http://localhost");
        url.searchParams.set("saved", "1");
        url.searchParams.set("savedAction", submitAction);
        if (goalKey) url.searchParams.set("savedGoalKey", goalKey);
        redirect(`${url.pathname}?${url.searchParams.toString()}`);
      } catch {
        redirect(`/threads/${parsed.data.id}?tab=execution&mode=view&saved=1&savedAction=${submitAction}${goalKey ? `&savedGoalKey=${encodeURIComponent(goalKey)}` : ""}`);
      }
    } else {
      redirect(`/threads/${parsed.data.id}?tab=execution&mode=view&saved=1&savedAction=${submitAction}${goalKey ? `&savedGoalKey=${encodeURIComponent(goalKey)}` : ""}`);
    }
  }
}

export async function updateThreadPlanAction(formData: FormData) {
  const parsed = updateThreadPlanSchema.safeParse({
    id: formData.get("id"),
    keyProjectScenario: formData.get("keyProjectScenario"),
    productLine: formData.get("productLine"),
    keyScenarioDescription: formData.get("keyScenarioDescription"),
    targetDimension: formData.getAll("targetDimension"),
    targetDescription: formData.get("targetDescription"),
    businessStage: formData.get("businessStage"),
    businessGoalAchieved: formData.get("businessGoalAchieved"),
    orgCurrentState: formData.get("orgCurrentState"),
    orgChanges: formData.get("orgChanges"),
    businessNeedAnalysis: formData.get("businessNeedAnalysis"),
    personalNeeds: formData.get("personalNeeds"),
    smartGoal: formData.get("smartGoal"),
    alignedWithCustomer: formData.get("alignedWithCustomer"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新客户成功计划失败");
  }

  const current = await getThreadDetail(parsed.data.id);
  if (!current) {
    throw new Error("客户成功计划不存在");
  }

  const currentGoal = current.goalSection && typeof current.goalSection === "object" ? (current.goalSection as Record<string, unknown>) : {};
  const currentOrg = current.orgSection && typeof current.orgSection === "object" ? (current.orgSection as Record<string, unknown>) : {};
  const currentSuccess =
    current.successSection && typeof current.successSection === "object"
      ? (current.successSection as Record<string, unknown>)
      : {};
  const currentActivity =
    current.activitySection && typeof current.activitySection === "object"
      ? (current.activitySection as Record<string, unknown>)
      : {};

  await updateThreadOverview(parsed.data.id, {
    keyProjectScenario: parsed.data.keyProjectScenario,
    productLine: parsed.data.productLine || null,
  });
  await updateThreadSection(parsed.data.id, "activitySection", {
    ...currentActivity,
    keyScenarioDescription: parsed.data.keyScenarioDescription,
  } as never);
  await updateThreadSection(parsed.data.id, "goalSection", {
    ...currentGoal,
    targetDimension: parsed.data.targetDimension,
    targetDescription: parsed.data.targetDescription,
    businessStage: parsed.data.businessStage,
    businessGoalAchieved: parsed.data.businessGoalAchieved,
  } as never);
  await updateThreadSection(parsed.data.id, "orgSection", {
    ...currentOrg,
    orgCurrentState: parsed.data.orgCurrentState,
    orgChanges: parsed.data.orgChanges,
  } as never);
  await updateThreadSection(parsed.data.id, "successSection", {
    ...currentSuccess,
    businessNeedAnalysis: parsed.data.businessNeedAnalysis,
    personalNeeds: parsed.data.personalNeeds,
    smartGoal: parsed.data.smartGoal,
    alignedWithCustomer: parsed.data.alignedWithCustomer,
  } as never);
  revalidatePath(`/threads/${parsed.data.id}`);
  revalidatePath("/threads");
}

export async function deleteThreadAction(formData: FormData) {
  const parsed = deleteThreadSchema.safeParse({
    id: formData.get("id"),
    role: formData.get("role"),
    customerId: formData.get("customerId"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "删除客户成功计划失败");
  }

  const role = parseViewerRole(parsed.data.role);
  if (!isSupervisorRole(role)) {
    throw new Error("仅大客户服务主管可删除客户成功计划");
  }

  await deleteThread(parsed.data.id);
  revalidatePath("/threads");
  revalidatePath("/dashboard");
  if (parsed.data.customerId) {
    revalidatePath(`/threads/customers/${parsed.data.customerId}`);
  }
}

