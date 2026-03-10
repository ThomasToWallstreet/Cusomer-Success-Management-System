"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { ok: true, message: "" };

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <Card className="w-full max-w-md border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>账号登录</CardTitle>
        <CardDescription>使用主管或经理账号登录系统</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo || ""} />
          <div className="space-y-2">
            <Label htmlFor="username">账号</Label>
            <Input id="username" name="username" placeholder="请输入账号" required autoComplete="username" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input id="password" name="password" type="password" placeholder="请输入密码" required autoComplete="current-password" />
          </div>
          {state?.ok === false ? <p className="text-sm text-red-600">{state.message}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "登录中..." : "登录"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
