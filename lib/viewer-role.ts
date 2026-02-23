export type ViewerRole = "supervisor" | "manager";

export function parseViewerRole(input?: string | null): ViewerRole {
  return input === "supervisor" ? "supervisor" : "manager";
}

export function isSupervisorRole(role: ViewerRole) {
  return role === "supervisor";
}
