"use server";

import { redirect } from "next/navigation";

import { setSessionCookies, clearSessionCookies } from "@/lib/auth/session";
import { updateLastLogin, verifyUserCredentials } from "@/lib/auth/account-service";

function invalidError() {
  return "账号或密码错误";
}

export async function loginAction(_prevState: { ok: boolean; message: string }, formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "").trim();

  if (!username || !password) {
    return { ok: false as const, message: invalidError() };
  }

  const user = await verifyUserCredentials(username, password);
  if (!user) {
    return { ok: false as const, message: invalidError() };
  }

  await setSessionCookies({
    id: user.id,
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    managerName: user.managerBinding?.managerName || undefined,
    isActive: user.isActive,
  });
  await updateLastLogin(user.id);

  const redirectTo = String(formData.get("redirectTo") || "").trim();
  if (redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookies();
  redirect("/login");
}

