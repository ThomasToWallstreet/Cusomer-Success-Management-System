"use server";

import { revalidatePath } from "next/cache";

import { assertSupervisorAction, getActionAuth } from "@/lib/auth/action-auth";
import {
  createUser,
  deleteUser,
  resetUserPassword,
  setUserActive,
  updateSelfPassword,
} from "@/lib/auth/account-service";
import { revokeAllUserSessions } from "@/lib/auth/session";

export async function createUserAction(formData: FormData) {
  await assertSupervisorAction();

  const accountType = String(formData.get("accountType") || "MANAGER").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();
  const managerName = String(formData.get("managerName") || "").trim();

  if (!username || !password) {
    throw new Error("请完整填写账号和初始密码");
  }
  if (accountType !== "MANAGER" && accountType !== "SUPERVISOR_LEAD" && accountType !== "SUPERVISOR_ADMIN") {
    throw new Error("账号类型不合法");
  }
  if (accountType === "MANAGER" && !managerName) {
    throw new Error("请填写大客户服务经理姓名");
  }

  const role = accountType === "MANAGER" ? "MANAGER" : "SUPERVISOR";
  const displayName =
    accountType === "MANAGER"
      ? managerName
      : accountType === "SUPERVISOR_ADMIN"
        ? "管理员"
        : "大客户服务主管";

  await createUser({
    username,
    displayName,
    password,
    role,
    managerName: accountType === "MANAGER" ? managerName : undefined,
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

export async function deleteUserAction(formData: FormData) {
  const currentUser = await assertSupervisorAction();
  const userId = String(formData.get("userId") || "").trim();
  if (!userId) {
    throw new Error("参数缺失");
  }
  if (userId === currentUser.id) {
    throw new Error("不允许删除当前登录账号");
  }
  await revokeAllUserSessions(userId);
  await deleteUser(userId);
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
