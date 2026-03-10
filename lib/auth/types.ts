import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  managerName?: string;
  isActive: boolean;
};

export type IdentityPayload = {
  uid: string;
  role: UserRole;
  managerName?: string;
  username: string;
  displayName: string;
  exp: number;
};
