import { requireAuth, toViewerRole } from "@/lib/auth/server";
import { listManagerNames, resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";

export async function resolveViewerContext(managerNameQuery?: string) {
  const user = await requireAuth();
  const role = toViewerRole(user);
  const isSupervisor = user.role === "SUPERVISOR";

  if (!isSupervisor) {
    if (!user.managerName) {
      throw new Error("当前经理账号未绑定数据范围，请联系主管配置");
    }
    const managerNames = await listManagerNames();
    return {
      user,
      role,
      isSupervisor,
      managerName: user.managerName,
      managerNames: managerNames.includes(user.managerName)
        ? managerNames
        : [user.managerName, ...managerNames],
    };
  }

  const { managerName, managerNames } = await resolveCurrentManager(managerNameQuery, {
    allowAll: true,
  });

  return {
    user,
    role,
    isSupervisor,
    managerName,
    managerNames,
  };
}
