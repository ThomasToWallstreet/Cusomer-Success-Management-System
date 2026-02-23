"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createWeeklyReport } from "@/lib/repos/weekly-report-repo";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import { createWeeklyReportSchema } from "@/lib/validators/weekly-report";
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
