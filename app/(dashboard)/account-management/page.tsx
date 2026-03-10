import { createUserAction, resetUserPasswordAction, toggleUserActiveAction } from "@/app/(dashboard)/account-management/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listUsers } from "@/lib/auth/account-service";
import { requireSupervisor } from "@/lib/auth/server";
import { listManagerNames } from "@/lib/repos/manager-assignment-repo";

export const dynamic = "force-dynamic";

export default async function AccountManagementPage() {
  await requireSupervisor();
  const [users, managerNames] = await Promise.all([listUsers(), listManagerNames()]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>账号管理</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-3 md:grid-cols-6">
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="role">角色</Label>
              <select id="role" name="role" className="h-9 w-full rounded-md border px-2 text-sm" defaultValue="MANAGER">
                <option value="MANAGER">经理</option>
                <option value="SUPERVISOR">主管</option>
              </select>
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="username">账号</Label>
              <Input id="username" name="username" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="displayName">显示名</Label>
              <Input id="displayName" name="displayName" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="password">初始密码</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <div className="space-y-1 md:col-span-1">
              <Label htmlFor="managerName">绑定经理名</Label>
              <select id="managerName" name="managerName" className="h-9 w-full rounded-md border px-2 text-sm" defaultValue="">
                <option value="">不绑定</option>
                {managerNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
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
                    角色：{user.role === "SUPERVISOR" ? "主管" : "经理"}
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
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
