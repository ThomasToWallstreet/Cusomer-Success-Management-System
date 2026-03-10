import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import type { UserRole } from "@prisma/client";

export async function findUserByUsername(username: string) {
  return prisma.user.findUnique({
    where: { username },
    include: { managerBinding: true },
  });
}

export async function verifyUserCredentials(username: string, password: string) {
  const user = await findUserByUsername(username);
  if (!user) return null;
  if (!user.isActive) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function updateLastLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function createUser(params: {
  username: string;
  password: string;
  role: UserRole;
  displayName: string;
  managerName?: string;
}) {
  return prisma.user.create({
    data: {
      username: params.username,
      passwordHash: hashPassword(params.password),
      role: params.role,
      displayName: params.displayName,
      managerBinding: {
        create: {
          managerName: params.managerName || null,
        },
      },
    },
    include: { managerBinding: true },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    include: { managerBinding: true },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });
}

export async function resetUserPassword(userId: string, password: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(password),
      mustChangePassword: false,
    },
  });
}

export async function setUserActive(userId: string, isActive: boolean) {
  await prisma.user.update({
    where: { id: userId },
    data: { isActive },
  });
}

export async function updateSelfPassword(userId: string, oldPassword: string, nextPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error("账号不存在");
  }
  if (!verifyPassword(oldPassword, user.passwordHash)) {
    throw new Error("旧密码不正确");
  }
  await prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: hashPassword(nextPassword),
      mustChangePassword: false,
    },
  });
}

export async function bootstrapSupervisorIfNeeded() {
  const count = await prisma.user.count({ where: { role: "SUPERVISOR" } });
  if (count > 0) {
    return;
  }

  const username = (process.env.BOOTSTRAP_SUPERVISOR_USERNAME || "supervisor").trim();
  const password = (process.env.BOOTSTRAP_SUPERVISOR_PASSWORD || "ChangeMe123!").trim();
  const displayName = (process.env.BOOTSTRAP_SUPERVISOR_DISPLAY_NAME || "大客户服务主管").trim();

  await prisma.user.create({
    data: {
      username,
      passwordHash: hashPassword(password),
      role: "SUPERVISOR",
      displayName,
      mustChangePassword: true,
      managerBinding: {
        create: {
          managerName: null,
        },
      },
    },
  });
}
