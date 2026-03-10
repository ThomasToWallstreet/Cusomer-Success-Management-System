"use server";

import { revalidatePath } from "next/cache";

import { assertSupervisorAction, getActionAuth } from "@/lib/auth/action-auth";
import {
  createUser,
  resetUserPassword,
  setUserActive,
  updateSelfPassword,
} from "@/lib/auth/account-service";
import { revokeAllUserSessions } from "@/lib/auth/session";

export async function createUserAction(formData: FormData) {
  await assertSupervisorAction();

  const role = String(formData.get("role") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const managerName = String(formData.get("managerName") || "").trim();

  if (!username || !displayName || !password) {
    throw new Error("请完整填写账号、显示名与初始密码");
  }
  if (role !== "SUPERVISOR" && role !== "MANAGER") {
    throw new Error("角色不合法");
  }
  if (role === "MANAGER" && !managerName) {
    throw new Error("经理账号必须绑定经理姓名");
  }

  await createUser({
    username,
    displayName,
    password,
    role,
    managerName: role === "MANAGER" ? managerName : undefined,
  });

  revalidatePath("/account-management");
}

export async function resetUserPasswordAction(formData: FormData) {
  await assertSupervisorAction();
  const userId = String(formData.get("userId") || "").trim();
  const password = String(formData.get("password") || "").trim();
  if (!userId || !password) {
    throw new Error("参数缺失");
  }
  await resetUserPassword(userId, password);
  await revokeAllUserSessions(userId);
  revalidatePath("/account-management");
}

export async function toggleUserActiveAction(formData: FormData) {
  await assertSupervisorAction();
  const userId = String(formData.get("userId") || "").trim();
  const next = String(formData.get("next") || "").trim();
  if (!userId || (next !== "0" && next !== "1")) {
    throw new Error("参数缺失");
  }
  const active = next === "1";
  await setUserActive(userId, active);
  if (!active) {
    await revokeAllUserSessions(userId);
  }
  revalidatePath("/account-management");
}

export async function updateSelfPasswordAction(formData: FormData) {
  const user = await getActionAuth();
  const oldPassword = String(formData.get("oldPassword") || "").trim();
  const nextPassword = String(formData.get("nextPassword") || "").trim();
  if (!oldPassword || !nextPassword) {
    throw new Error("请完整填写旧密码和新密码");
  }
  await updateSelfPassword(user.id, oldPassword, nextPassword);
  await revokeAllUserSessions(user.id);
  revalidatePath("/my-account");
}
