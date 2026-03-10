import { redirect } from "next/navigation";

import { getCurrentAuthUser } from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

export function isSupervisor(user: AuthUser) {
  return user.role === "SUPERVISOR";
}

export function toViewerRole(user: AuthUser): "supervisor" | "manager" {
  return isSupervisor(user) ? "supervisor" : "manager";
}

export async function getCurrentUser() {
  return getCurrentAuthUser();
}

export async function requireAuth() {
  const user = await getCurrentAuthUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireSupervisor() {
  const user = await requireAuth();
  if (!isSupervisor(user)) {
    redirect("/dashboard");
  }
  return user;
}

export async function requireManagerBinding(user: AuthUser) {
  if (isSupervisor(user)) {
    return user.managerName;
  }
  if (!user.managerName) {
    throw new Error("当前账号未绑定大客户服务经理，请联系主管配置");
  }
  return user.managerName;
}
