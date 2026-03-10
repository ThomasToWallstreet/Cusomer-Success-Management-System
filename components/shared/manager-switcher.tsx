"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function ManagerSwitcher({
  managers,
  currentManager,
  allowAll,
}: {
  managers: string[];
  currentManager?: string;
  allowAll: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedManager =
    currentManager ||
    searchParams.get("managerName") ||
    (allowAll ? "ALL" : managers[0]);

  if (!managers.length) {
    return <p className="text-xs text-muted-foreground">尚未配置经理映射，请先到客户管理维护。</p>;
  }

  if (!allowAll) {
    return (
      <div className="rounded-md border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
        当前经理：{selectedManager}
      </div>
    );
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
        <option value="ALL">全部</option>
        {managers.map((manager) => (
          <option key={manager} value={manager}>
            {manager}
          </option>
        ))}
      </select>
    </div>
  );
}
