import { createHmac } from "node:crypto";

import { AUTH_IDENTITY_COOKIE, SESSION_DAYS, SESSION_SECRET } from "@/lib/auth/constants";
import type { IdentityPayload } from "@/lib/auth/types";

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function fromBase64Url(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(input: string) {
  return createHmac("sha256", SESSION_SECRET).update(input).digest("base64url");
}

export function createIdentityCookieValue(payload: Omit<IdentityPayload, "exp">) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const body = toBase64Url(JSON.stringify({ ...payload, exp }));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function parseIdentityCookieValue(value?: string | null): IdentityPayload | null {
  if (!value) return null;
  const [body, signature] = value.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  if (expected !== signature) return null;
  try {
    const payload = JSON.parse(fromBase64Url(body)) as IdentityPayload;
    if (!payload?.uid || !payload?.role || !payload?.exp) return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getIdentityCookieName() {
  return AUTH_IDENTITY_COOKIE;
}
