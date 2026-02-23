"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomerListEntry,
  deleteCustomerListEntry,
  importCustomerListCsvFullReplace,
  updateCustomerListEntry,
} from "@/lib/repos/customer-list-repo";
import {
  createCustomerListEntrySchema,
  deleteCustomerListRowSchema,
  importCustomerListCsvSchema,
  updateCustomerListEntrySchema,
} from "@/lib/validators/customer-management";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

function assertSupervisor(formData: FormData) {
  const role = parseViewerRole(String(formData.get("role") || ""));
  if (!isSupervisorRole(role)) {
    throw new Error("仅大客户服务主管可维护客户清单");
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
