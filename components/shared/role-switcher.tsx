"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function RoleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "supervisor" ? "supervisor" : "manager";

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="role-switcher" className="text-xs text-muted-foreground">
        当前角色
      </label>
      <select
        id="role-switcher"
        className="h-8 rounded-md border bg-background px-2 text-sm"
        value={role}
        onChange={(event) => {
          const next = new URLSearchParams(searchParams.toString());
          next.set("role", event.target.value);
          if (event.target.value === "supervisor") {
            next.set("managerName", "ALL");
          } else {
            next.delete("managerName");
          }
          next.delete("customerId");
          router.push(`${pathname}?${next.toString()}`);
        }}
      >
        <option value="supervisor">大客户服务主管</option>
        <option value="manager">大客户服务经理</option>
      </select>
    </div>
  );
}
