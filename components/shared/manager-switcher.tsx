"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ManagerSwitcher({
  managers,
  currentManager,
}: {
  managers: string[];
  currentManager?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "supervisor" ? "supervisor" : "manager";
  const rawManager = currentManager || searchParams.get("managerName");
  const selectedManager =
    role === "supervisor"
      ? rawManager || "ALL"
      : rawManager && rawManager !== "ALL"
        ? rawManager
        : managers[0];

  if (!managers.length) {
    return <p className="text-xs text-muted-foreground">尚未配置经理映射，请先到客户管理维护。</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="manager-switcher" className="text-xs text-muted-foreground">
        当前经理
      </label>
      <select
        id="manager-switcher"
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={selectedManager}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("managerName", event.target.value);
          next.delete("customerId");
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        {role === "supervisor" ? <option value="ALL">全部</option> : null}
        {managers.map((manager) => (
          <option key={manager} value={manager}>
            {manager}
          </option>
        ))}
      </select>
    </div>
  );
}
