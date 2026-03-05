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
} from "@/lib/repos/customer-contact-repo";
import {
  createCustomerProjectItem,
  deleteCustomerProjectItem,
  getCustomerProjectItemById,
  updateCustomerProjectItem,
} from "@/lib/repos/customer-project-repo";
import {
  createCustomerScenarioItem,
  deleteCustomerScenarioItem,
  getCustomerScenarioItemById,
  updateCustomerScenarioItem,
} from "@/lib/repos/customer-scenario-repo";
import {
  createCustomerContactSchema,
  deleteCustomerContactSchema,
  updateCustomerContactSchema,
} from "@/lib/validators/customer-contact";
import {
  createCustomerProjectSchema,
  deleteCustomerProjectSchema,
  updateCustomerProjectSchema,
} from "@/lib/validators/customer-project";
import {
  createCustomerScenarioSchema,
  deleteCustomerScenarioSchema,
  updateCustomerScenarioSchema,
} from "@/lib/validators/customer-scenario";
import {
  createCustomerListEntrySchema,
  deleteCustomerListRowSchema,
  importCustomerListCsvSchema,
  updateCustomerListEntrySchema,
} from "@/lib/validators/customer-management";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
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

export async function createCustomerScenarioAction(formData: FormData) {
  const parsed = createCustomerScenarioSchema.safeParse({
    customerId: formData.get("customerId"),
    name: formData.get("name"),
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
  await createCustomerScenarioItem(parsed.data);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

export async function updateCustomerScenarioAction(formData: FormData) {
  const parsed = updateCustomerScenarioSchema.safeParse({
    id: formData.get("id"),
    customerId: formData.get("customerId"),
    name: formData.get("name"),
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
  await deleteCustomerScenarioItem(parsed.data.id);
  revalidatePath("/customer-management");
  revalidatePath("/threads/new");
}

