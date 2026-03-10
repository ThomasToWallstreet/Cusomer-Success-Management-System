import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { bootstrapSupervisorIfNeeded } from "@/lib/auth/account-service";
import { getCurrentUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await bootstrapSupervisorIfNeeded();

  const user = await getCurrentUser();
  if (user) {
    redirect("/dashboard");
  }
  const query = await searchParams;
  const redirectTo = getOne(query.redirectTo);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-10">
        <div className="grid w-full gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <h1 className="text-3xl font-semibold text-slate-900">深圳区KA客户成功管理系统</h1>
            <p className="text-sm leading-7 text-slate-600">
              登录后可按角色访问客户管理、计划进展与周报模块。主管可统一管理账号与密码，经理仅查看绑定范围数据。
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <LoginForm redirectTo={redirectTo} />
          </div>
        </div>
      </div>
    </div>
  );
}
