"use server";

import { requireAuth } from "@/lib/auth/server";

export async function getActionAuth() {
  return requireAuth();
}

export async function assertSupervisorAction() {
  const user = await requireAuth();
  if (user.role !== "SUPERVISOR") {
    throw new Error("仅大客户服务主管可执行该操作");
  }
  return user;
}

export async function getScopedManagerName() {
  const user = await requireAuth();
  if (user.role === "SUPERVISOR") {
    return "ALL";
  }
  if (!user.managerName) {
    throw new Error("当前账号未绑定经理姓名，无法执行操作");
  }
  return user.managerName;
}
