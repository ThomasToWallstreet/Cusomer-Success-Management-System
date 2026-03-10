import Link from "next/link";

import { logoutAction } from "@/app/login/actions";
import { TopNav } from "@/components/shared/top-nav";
import { ManagerSwitcher } from "@/components/shared/manager-switcher";
import { Button } from "@/components/ui/button";
import { resolveViewerContext } from "@/lib/auth/viewer-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, managerName, managerNames, isSupervisor } = await resolveViewerContext(undefined);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-base font-semibold">深圳区KA客户成功管理系统</h1>
            <div className="flex flex-wrap items-center gap-3">
              <ManagerSwitcher managers={managerNames} currentManager={managerName} allowAll={isSupervisor} />
              <div className="text-xs text-muted-foreground">
                {user.displayName}（{user.role === "SUPERVISOR" ? "主管" : "经理"}）
              </div>
              <form action={logoutAction}>
                <Button type="submit" size="sm" variant="outline">
                  退出登录
                </Button>
              </form>
            </div>
          </div>
          <TopNav showAccountAdmin={isSupervisor} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
