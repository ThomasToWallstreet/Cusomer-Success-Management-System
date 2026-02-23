import { TopNav } from "@/components/shared/top-nav";
import { ManagerSwitcher } from "@/components/shared/manager-switcher";
import { RoleSwitcher } from "@/components/shared/role-switcher";
import { listManagerNames } from "@/lib/repos/manager-assignment-repo";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const managers = await listManagerNames();
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-base font-semibold">深圳区KA客户成功管理系统</h1>
            <div className="flex items-center gap-3">
              <RoleSwitcher />
              <ManagerSwitcher managers={managers} />
            </div>
          </div>
          <TopNav />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
