import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [salt, hash] = passwordHash.split(":");
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, 64).toString("hex");
  const left = Buffer.from(hash, "hex");
  const right = Buffer.from(derived, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
