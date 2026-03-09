"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomerListEntry,
  deleteCustomerListEntry,
  importCustomerListCsvFullReplace,
  updateCustomerListEntry,
} from "@/lib/repos/customer-list-repo";
import {
  createCustomerContact,
  deleteCustomerContact,
  getCustomerContactById,
  updateCustomerContact,
  updateCustomerContactSatisfaction,
} from "@/lib/repos/customer-contact-repo";
import {
  createCustomerProjectItem,
  deleteCustomerProjectItem,
  getCustomerProjectItemById,
  updateCustomerProjectBusinessGoal,
  updateCustomerProjectItem,
} from "@/lib/repos/customer-project-repo";
import {
  createCustomerScenarioItem,
  deleteCustomerScenarioItem,
  getCustomerScenarioItemById,
  updateCustomerScenarioAlignment,
  updateCustomerScenarioItem,
} from "@/lib/repos/customer-scenario-repo";
import {
  createCustomerContactSchema,
  deleteCustomerContactSchema,
  updateCustomerContactSchema,
  updateCustomerContactSatisfactionSchema,
} from "@/lib/validators/customer-contact";
import {
  createCustomerProjectSchema,
  deleteCustomerProjectSchema,
  updateCustomerProjectBusinessGoalSchema,
  updateCustomerProjectSchema,
} from "@/lib/validators/customer-project";
import {
  createCustomerScenarioSchema,
  deleteCustomerScenarioSchema,
  updateCustomerScenarioAlignmentSchema,
  updateCustomerScenarioSchema,
} from "@/lib/validators/customer-scenario";
import {
  createCustomerListEntrySchema,
  deleteCustomerListRowSchema,
  importCustomerListCsvSchema,
  updateCustomerListEntrySchema,
} from "@/lib/validators/customer-management";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import {
  deleteScenarioAttachmentFiles,
  getScenarioAttachmentFiles,
  saveScenarioAttachments,
} from "@/lib/services/customer-scenario-attachment-service";
import { listThreads, updateThreadSection } from "@/lib/repos/thread-repo";
import { deriveOrgChangesFromSatisfactionStates } from "@/lib/thread-goal-progress";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

function assertSupervisor(formData: FormData) {
  const role = parseViewerRole(String(formData.get("role") || ""));
  if (!isSupervisorRole(role)) {
    throw new Error("仅大客户服务主管可维护客户清单");
  }
}

async function assertCustomerScopedPermission(formData: FormData, customerId: string) {
  const role = parseViewerRole(String(formData.get("role") || ""));
  if (isSupervisorRole(role)) {
    return;
  }
  const managerName = String(formData.get("managerName") || "").trim();
  if (!managerName || managerName === "ALL") {
    throw new Error("经理信息缺失，无法维护关键人");
  }
  const allowedCustomerIds = await listCustomerIdsByManager(managerName);
  if (!allowedCustomerIds.includes(customerId)) {
    throw new Error("仅可维护本人负责客户的主数据");
  }
}

export async function upsertAssignmentAction(formData: FormData) {
  assertSupervisor(formData);
  throw new Error("标准化客户清单请通过 CSV 全量导入维护");
}

export async function createCustomerListEntryAction(formData: FormData) {
  assertSupervisor(formData);
  const parsed = createCustomerListEntrySchema.safeParse({
    customerName: formData.get("customerName"),
    groupBranch: formData.get("groupBranch"),
    industry: formData.get("industry"),
    customerType: formData.get("customerType"),
    customerStage: formData.get("customerStage"),
    annualCapacity: formData.get("annualCapacity"),
    order25: formData.get("order25"),
    performance25: formData.get("performance25"),
    order26: formData.get("order26"),
    performance26: formData.get("performance26"),
    growthOrder: formData.get("growthOrder"),
    growthPerformance: formData.get("growthPerformance"),
    sales: formData.get("sales"),
    preSalesSecurity: formData.get("preSalesSecurity"),
    preSalesCloud: formData.get("preSalesCloud"),
    accountServiceManager: formData.get("accountServiceManager"),
    remark: formData.get("remark"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "新增客户清单失败");
  }
  await createCustomerListEntry(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads");
  revalidatePath("/weekly-reports");
  revalidatePath("/dashboard");
}

export async function updateCustomerListEntryAction(formData: FormData) {
  assertSupervisor(formData);
  const parsed = updateCustomerListEntrySchema.safeParse({
    id: formData.get("id"),
    customerName: formData.get("customerName"),
    groupBranch: formData.get("groupBranch"),
    industry: formData.get("industry"),
    customerType: formData.get("customerType"),
    customerStage: formData.get("customerStage"),
    annualCapacity: formData.get("annualCapacity"),
    order25: formData.get("order25"),
    performance25: formData.get("performance25"),
    order26: formData.get("order26"),
    performance26: formData.get("performance26"),
    growthOrder: formData.get("growthOrder"),
    growthPerformance: formData.get("growthPerformance"),
    sales: formData.get("sales"),
    preSalesSecurity: formData.get("preSalesSecurity"),
    preSalesCloud: formData.get("preSalesCloud"),
    accountServiceManager: formData.get("accountServiceManager"),
    remark: formData.get("remark"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新客户清单失败");
  }
  await updateCustomerListEntry(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads");
  revalidatePath("/weekly-reports");
  revalidatePath("/dashboard");
}

export async function deleteAssignmentAction(formData: FormData) {
  assertSupervisor(formData);
  const parsed = deleteCustomerListRowSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "删除客户清单失败");
  }
  await deleteCustomerListEntry(parsed.data.id);
  revalidatePath("/customer-management");
  revalidatePath("/threads");
  revalidatePath("/weekly-reports");
  revalidatePath("/dashboard");
}

export async function importAssignmentCsvAction(formData: FormData) {
  assertSupervisor(formData);
  const parsed = importCustomerListCsvSchema.safeParse({
    file: formData.get("file"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "导入 CSV 失败");
  }

  const file = parsed.data.file;
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("CSV 文件不能超过 10MB");
  }
  const result = await importCustomerListCsvFullReplace(await file.text(), file.name);
  if (result.errors.length) {
    throw new Error(`导入失败（共 ${result.total} 行）：${result.errors.join("；")}`);
  }

  revalidatePath("/customer-management");
  revalidatePath("/threads");
  revalidatePath("/weekly-reports");
  revalidatePath("/dashboard");
}

export async function createCustomerContactAction(formData: FormData) {
  const parsed = createCustomerContactSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    department: formData.get("department"),
    level: formData.get("level"),
    satisfactionCurrent: formData.get("satisfactionCurrent"),
    satisfactionTarget: formData.get("satisfactionTarget"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "新增关键人失败");
  }
  await assertCustomerScopedPermission(formData, parsed.data.customerId);
  await createCustomerContact(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
  revalidatePath("/threads");
}

export async function updateCustomerContactAction(formData: FormData) {
  const parsed = updateCustomerContactSchema.safeParse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    department: formData.get("department"),
    level: formData.get("level"),
    satisfactionCurrent: formData.get("satisfactionCurrent"),
    satisfactionTarget: formData.get("satisfactionTarget"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新关键人失败");
  }
  const existing = await getCustomerContactById(parsed.data.id);
  if (!existing) {
    throw new Error("关键人不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await assertCustomerScopedPermission(formData, parsed.data.customerId);
  await updateCustomerContact(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
  revalidatePath("/threads");
}

export async function deleteCustomerContactAction(formData: FormData) {
  const parsed = deleteCustomerContactSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "删除关键人失败");
  }
  const existing = await getCustomerContactById(parsed.data.id);
  if (!existing) {
    throw new Error("关键人不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await deleteCustomerContact(parsed.data.id);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
  revalidatePath("/threads");
}

export async function updateCustomerContactSatisfactionAction(formData: FormData) {
  const parsed = updateCustomerContactSatisfactionSchema.safeParse({
    id: formData.get("id"),
    satisfactionCurrent: formData.get("satisfactionCurrent"),
    satisfactionUpdatedAt: formData.get("satisfactionUpdatedAt"),
    satisfactionEvidence: formData.get("satisfactionEvidence"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新满意度现状失败");
  }
  const existing = await getCustomerContactById(parsed.data.id);
  if (!existing) {
    throw new Error("关键人不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await updateCustomerContactSatisfaction(parsed.data);

  const customerThreads = await listThreads({ customerId: existing.customerId });
  await Promise.all(
    customerThreads.map(async (thread) => {
      const orgSection =
        thread.orgSection && typeof thread.orgSection === "object"
          ? ({ ...(thread.orgSection as Record<string, unknown>) } as Record<string, unknown>)
          : {};
      const stakeholderRows = Array.isArray(orgSection.stakeholders)
        ? [...(orgSection.stakeholders as Array<Record<string, unknown>>)]
        : [];
      const nextStakeholderRows = stakeholderRows.map((row) => {
        const sameName = String(row.name || "").trim() === existing.name;
        const sameDept = (String(row.department || "").trim() || "-") === (existing.department || "-");
        const sameLevel = (String(row.level || "").trim() || "-") === (existing.level || "-");
        const sameContact = sameName && sameDept && sameLevel;
        if (!sameContact) return row;
        return {
          ...row,
          currentState: parsed.data.satisfactionCurrent,
        };
      });

      const snapshotRows = Array.isArray(orgSection.contactMasterSnapshotList)
        ? [...(orgSection.contactMasterSnapshotList as Array<Record<string, unknown>>)]
        : [];
      const referencesSnapshot = snapshotRows.some((row) => String(row.id || "") === existing.id);
      const referencesPrimary = String(thread.contactId || "") === existing.id;
      const referencesStakeholder = stakeholderRows.some((row) => String(row.name || "").trim() === existing.name);
      if (!referencesSnapshot && !referencesPrimary && !referencesStakeholder) {
        return;
      }
      const nextSnapshotRows = snapshotRows.map((row) => {
        if (String(row.id || "") !== existing.id) return row;
        return {
          ...row,
          satisfactionCurrent: parsed.data.satisfactionCurrent,
          satisfactionUpdatedAt: parsed.data.satisfactionUpdatedAt.toISOString(),
          satisfactionEvidence: parsed.data.satisfactionEvidence,
        };
      });

      const satisfactionStates = [
        ...nextStakeholderRows.map((row) => String(row.currentState || "").trim()).filter(Boolean),
        ...nextSnapshotRows.map((row) => String(row.satisfactionCurrent || "").trim()).filter(Boolean),
      ];
      const nextOrgChanges = deriveOrgChangesFromSatisfactionStates(satisfactionStates);
      await updateThreadSection(thread.id, "orgSection", {
        ...orgSection,
        stakeholders: nextStakeholderRows,
        contactMasterSnapshotList: nextSnapshotRows,
        orgCurrentState: parsed.data.satisfactionCurrent,
        orgChanges: nextOrgChanges,
      } as never);
    }),
  );

  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
  revalidatePath("/threads");
  revalidatePath(`/threads/customers/${existing.customerId}`);
}

export async function createCustomerProjectAction(formData: FormData) {
  const parsed = createCustomerProjectSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    productLine: formData.getAll("productLine"),
    targetDimension: formData.getAll("targetDimension"),
    targetDescription: formData.get("targetDescription"),
    businessStage: formData.get("businessStage"),
    businessGoalAchieved: formData.get("businessGoalAchieved"),
    keyScenarioDescription: formData.get("keyScenarioDescription"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "新增项目清单（突破/续费/复购）失败");
  }
  await assertCustomerScopedPermission(formData, parsed.data.customerId);
  await createCustomerProjectItem(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function updateCustomerProjectAction(formData: FormData) {
  const parsed = updateCustomerProjectSchema.safeParse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    productLine: formData.getAll("productLine"),
    targetDimension: formData.getAll("targetDimension"),
    targetDescription: formData.get("targetDescription"),
    businessStage: formData.get("businessStage"),
    businessGoalAchieved: formData.get("businessGoalAchieved"),
    keyScenarioDescription: formData.get("keyScenarioDescription"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新项目清单（突破/续费/复购）失败");
  }
  const existing = await getCustomerProjectItemById(parsed.data.id);
  if (!existing) {
    throw new Error("项目清单（突破/续费/复购）不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await assertCustomerScopedPermission(formData, parsed.data.customerId);
  await updateCustomerProjectItem(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function deleteCustomerProjectAction(formData: FormData) {
  const parsed = deleteCustomerProjectSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "删除项目清单（突破/续费/复购）失败");
  }
  const existing = await getCustomerProjectItemById(parsed.data.id);
  if (!existing) {
    throw new Error("项目清单（突破/续费/复购）不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await deleteCustomerProjectItem(parsed.data.id);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function updateCustomerProjectBusinessGoalAction(formData: FormData) {
  const parsed = updateCustomerProjectBusinessGoalSchema.safeParse({
    id: formData.get("id"),
    businessGoalAchieved: formData.get("businessGoalAchieved"),
    businessGoalUpdatedAt: formData.get("businessGoalUpdatedAt"),
    businessGoalEvidence: formData.get("businessGoalEvidence"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新经营目标是否达成失败");
  }
  const existing = await getCustomerProjectItemById(parsed.data.id);
  if (!existing) {
    throw new Error("项目清单（突破/续费/复购）不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await updateCustomerProjectBusinessGoal(parsed.data);

  const customerThreads = await listThreads({ customerId: existing.customerId });
  await Promise.all(
    customerThreads.map(async (thread) => {
      const goalSection =
        thread.goalSection && typeof thread.goalSection === "object"
          ? ({ ...(thread.goalSection as Record<string, unknown>) } as Record<string, unknown>)
          : {};
      const snapshot = goalSection.projectMasterSnapshot && typeof goalSection.projectMasterSnapshot === "object"
        ? (goalSection.projectMasterSnapshot as Record<string, unknown>)
        : {};
      const referencesProject =
        String(thread.projectItemId || "") === existing.id || String(snapshot.id || "") === existing.id;
      if (!referencesProject) return;

      const currentHistory = Array.isArray(goalSection.businessGoalHistory)
        ? [...(goalSection.businessGoalHistory as Array<Record<string, unknown>>)]
        : [];
      const nextHistory = [
        {
          businessGoalAchieved: parsed.data.businessGoalAchieved,
          businessGoalUpdatedAt: parsed.data.businessGoalUpdatedAt.toISOString(),
          businessGoalEvidence: parsed.data.businessGoalEvidence,
        },
        ...currentHistory,
      ].slice(0, 20);

      await updateThreadSection(thread.id, "goalSection", {
        ...goalSection,
        businessGoalAchieved: parsed.data.businessGoalAchieved,
        businessGoalUpdatedAt: parsed.data.businessGoalUpdatedAt.toISOString(),
        businessGoalEvidence: parsed.data.businessGoalEvidence,
        businessGoalHistory: nextHistory,
        projectMasterSnapshot: {
          ...snapshot,
          businessGoalAchieved: parsed.data.businessGoalAchieved,
          businessGoalUpdatedAt: parsed.data.businessGoalUpdatedAt.toISOString(),
          businessGoalEvidence: parsed.data.businessGoalEvidence,
        },
      } as never);
    }),
  );

  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
  revalidatePath("/threads");
  revalidatePath(`/threads/customers/${existing.customerId}`);
}

export async function createCustomerScenarioAction(formData: FormData) {
  const parsed = createCustomerScenarioSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    keyScenarioDescription: formData.get("keyScenarioDescription"),
    businessNeedAnalysis: formData.get("businessNeedAnalysis"),
    personalNeeds: formData.get("personalNeeds"),
    smartGoal: formData.get("smartGoal"),
    alignedWithCustomer: formData.get("alignedWithCustomer"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "新增关键场景清单失败");
  }
  await assertCustomerScopedPermission(formData, parsed.data.customerId);
  const created = await createCustomerScenarioItem(parsed.data);
  const attachments = getScenarioAttachmentFiles(formData);
  await saveScenarioAttachments(created.id, attachments);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function updateCustomerScenarioAction(formData: FormData) {
  const parsed = updateCustomerScenarioSchema.safeParse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    name: formData.get("name"),
    keyScenarioDescription: formData.get("keyScenarioDescription"),
    businessNeedAnalysis: formData.get("businessNeedAnalysis"),
    personalNeeds: formData.get("personalNeeds"),
    smartGoal: formData.get("smartGoal"),
    alignedWithCustomer: formData.get("alignedWithCustomer"),
    note: formData.get("note"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新关键场景清单失败");
  }
  const existing = await getCustomerScenarioItemById(parsed.data.id);
  if (!existing) {
    throw new Error("关键场景清单不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await assertCustomerScopedPermission(formData, parsed.data.customerId);
  await updateCustomerScenarioItem(parsed.data);
  const attachments = getScenarioAttachmentFiles(formData);
  await saveScenarioAttachments(parsed.data.id, attachments);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function deleteCustomerScenarioAction(formData: FormData) {
  const parsed = deleteCustomerScenarioSchema.safeParse({
    id: formData.get("id"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "删除关键场景清单失败");
  }
  const existing = await getCustomerScenarioItemById(parsed.data.id);
  if (!existing) {
    throw new Error("关键场景清单不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await deleteScenarioAttachmentFiles(existing.attachments || []);
  await deleteCustomerScenarioItem(parsed.data.id);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function updateCustomerScenarioAlignmentAction(formData: FormData) {
  const parsed = updateCustomerScenarioAlignmentSchema.safeParse({
    id: formData.get("id"),
    alignedWithCustomer: formData.get("alignedWithCustomer"),
    alignedUpdatedAt: formData.get("alignedUpdatedAt"),
    alignedEvidence: formData.get("alignedEvidence"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "更新是否与客户完成对齐失败");
  }
  const existing = await getCustomerScenarioItemById(parsed.data.id);
  if (!existing) {
    throw new Error("关键场景清单不存在或已删除");
  }
  await assertCustomerScopedPermission(formData, existing.customerId);
  await updateCustomerScenarioAlignment(parsed.data);

  const customerThreads = await listThreads({ customerId: existing.customerId });
  await Promise.all(
    customerThreads.map(async (thread) => {
      const successSection =
        thread.successSection && typeof thread.successSection === "object"
          ? ({ ...(thread.successSection as Record<string, unknown>) } as Record<string, unknown>)
          : {};
      const snapshot = successSection.scenarioMasterSnapshot && typeof successSection.scenarioMasterSnapshot === "object"
        ? (successSection.scenarioMasterSnapshot as Record<string, unknown>)
        : {};
      const referencesScenario =
        String(thread.scenarioItemId || "") === existing.id || String(snapshot.id || "") === existing.id;
      if (!referencesScenario) return;

      const currentHistory = Array.isArray(successSection.alignmentHistory)
        ? [...(successSection.alignmentHistory as Array<Record<string, unknown>>)]
        : [];
      const nextHistory = [
        {
          alignedWithCustomer: parsed.data.alignedWithCustomer,
          alignedUpdatedAt: parsed.data.alignedUpdatedAt.toISOString(),
          alignedEvidence: parsed.data.alignedEvidence,
        },
        ...currentHistory,
      ].slice(0, 20);

      await updateThreadSection(thread.id, "successSection", {
        ...successSection,
        alignedWithCustomer: parsed.data.alignedWithCustomer,
        alignedUpdatedAt: parsed.data.alignedUpdatedAt.toISOString(),
        alignedEvidence: parsed.data.alignedEvidence,
        alignmentHistory: nextHistory,
        scenarioMasterSnapshot: {
          ...snapshot,
          alignedWithCustomer: parsed.data.alignedWithCustomer,
          alignedUpdatedAt: parsed.data.alignedUpdatedAt.toISOString(),
          alignedEvidence: parsed.data.alignedEvidence,
        },
      } as never);
    }),
  );

  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
  revalidatePath("/threads");
  revalidatePath(`/threads/customers/${existing.customerId}`);
}

