import { logoutAction } from "@/app/login/actions";
import { TopNav } from "@/components/shared/top-nav";
import { Button } from "@/components/ui/button";
import { resolveViewerContext } from "@/lib/auth/viewer-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, role, managerName, isSupervisor } = await resolveViewerContext(undefined);

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-base font-semibold">深圳区KA客户成功管理系统</h1>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs text-muted-foreground">{user.displayName}</div>
              <form action={logoutAction}>
                <Button type="submit" size="sm" variant="outline">
                  退出登录
                </Button>
              </form>
            </div>
          </div>
          <TopNav showAccountAdmin={isSupervisor} role={role} managerName={managerName} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
