import { createUserAction, deleteUserAction, resetUserPasswordAction, toggleUserActiveAction } from "@/app/(dashboard)/account-management/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listUsers } from "@/lib/auth/account-service";
import { requireSupervisor } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function AccountManagementPage() {
  await requireSupervisor();
  const users = await listUsers();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>账号管理</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="accountType">账号类型</Label>
              <select id="accountType" name="accountType" className="h-9 w-full rounded-md border px-2 text-sm" defaultValue="MANAGER">
                <option value="MANAGER">大客户服务经理</option>
                <option value="SUPERVISOR_LEAD">大客户服务主管</option>
                <option value="SUPERVISOR_ADMIN">管理员</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="username">账号</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="password">初始密码</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="managerName">大客户服务经理</Label>
              <Input id="managerName" name="managerName" placeholder="例如：刘阳（仅经理账号必填）" />
              <p className="text-xs text-muted-foreground">经理账号会按此姓名自动绑定客户清单中的“大客户服务经理”映射。</p>
            </div>
            <div className="flex items-end md:col-span-1">
              <Button type="submit" size="sm" className="w-full">
                创建账号
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>账号列表</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{user.displayName}（{user.username}）</p>
                  <p className="text-muted-foreground">
                    账号类型：{user.role === "SUPERVISOR" ? (user.displayName === "管理员" ? "管理员" : "大客户服务主管") : "大客户服务经理"}
                    {user.managerBinding?.managerName ? ` / 绑定经理：${user.managerBinding.managerName}` : ""}
                    {user.isActive ? " / 启用" : " / 禁用"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={toggleUserActiveAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="next" value={user.isActive ? "0" : "1"} />
                    <Button type="submit" size="sm" variant="outline">
                      {user.isActive ? "禁用" : "启用"}
                    </Button>
                  </form>
                  <form action={resetUserPasswordAction} className="flex items-center gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <Input name="password" type="password" placeholder="新密码" className="h-8 w-36" required />
                    <Button type="submit" size="sm" variant="outline">
                      重置密码
                    </Button>
                  </form>
                  <form action={deleteUserAction}>
                    <input type="hidden" name="userId" value={user.id} />
                    <Button type="submit" size="sm" variant="destructive">
                      删除账号
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
