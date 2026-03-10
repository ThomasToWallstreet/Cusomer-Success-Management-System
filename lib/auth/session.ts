import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";
import { AUTH_IDENTITY_COOKIE, AUTH_SESSION_COOKIE, SESSION_DAYS, SESSION_SECRET } from "@/lib/auth/constants";
import { createIdentityCookieValue } from "@/lib/auth/identity";
import type { AuthUser } from "@/lib/auth/types";

function hashSessionToken(token: string) {
  return createHash("sha256").update(`${SESSION_SECRET}:${token}`).digest("hex");
}

function getExpireDate() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = getExpireDate();
  await prisma.userSession.create({
    data: {
      userId,
      sessionTokenHash: hashSessionToken(token),
      expiresAt,
    },
  });
  return { token, expiresAt };
}

export async function getCurrentAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { sessionTokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: {
          managerBinding: true,
        },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.userSession.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  if (!session.user.isActive) {
    return null;
  }

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
    displayName: session.user.displayName,
    managerName: session.user.managerBinding?.managerName || undefined,
    isActive: session.user.isActive,
  };
}

export async function setSessionCookies(user: AuthUser) {
  const { token, expiresAt } = await createSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  cookieStore.set(
    AUTH_IDENTITY_COOKIE,
    createIdentityCookieValue({
      uid: user.id,
      role: user.role,
      username: user.username,
      displayName: user.displayName,
      managerName: user.managerName,
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    },
  );
}

export async function clearSessionCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  if (token) {
    await prisma.userSession
      .deleteMany({
        where: { sessionTokenHash: hashSessionToken(token) },
      })
      .catch(() => undefined);
  }
  cookieStore.delete(AUTH_SESSION_COOKIE);
  cookieStore.delete(AUTH_IDENTITY_COOKIE);
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.userSession.deleteMany({ where: { userId } });
}
