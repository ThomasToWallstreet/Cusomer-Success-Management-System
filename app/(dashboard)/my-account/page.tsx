import { updateSelfPasswordAction } from "@/app/(dashboard)/account-management/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireAuth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function MyAccountPage() {
  const user = await requireAuth();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>我的账号</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-lg border p-3 text-sm">
            <p>账号：{user.username}</p>
            <p>显示名：{user.displayName}</p>
            <p>角色：{user.role === "SUPERVISOR" ? "主管" : "经理"}</p>
            {user.managerName ? <p>绑定经理：{user.managerName}</p> : null}
          </div>

          <form action={updateSelfPasswordAction} className="space-y-3 max-w-md">
            <div className="space-y-1">
              <Label htmlFor="oldPassword">旧密码</Label>
              <Input id="oldPassword" name="oldPassword" type="password" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="nextPassword">新密码</Label>
              <Input id="nextPassword" name="nextPassword" type="password" required />
            </div>
            <Button type="submit" size="sm">更新密码</Button>
            <p className="text-xs text-muted-foreground">修改密码后会自动退出，需要重新登录。</p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
