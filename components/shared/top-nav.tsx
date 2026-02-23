"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "仪表盘" },
  { href: "/customer-management", label: "客户管理" },
  { href: "/threads", label: "客户成功计划" },
  { href: "/weekly-reports", label: "周报" },
];

export function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const managerName = searchParams.get("managerName");
  const role = searchParams.get("role");

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Button
            key={item.href}
            asChild
            variant={active ? "default" : "outline"}
            size="sm"
            className={active ? "rounded-full px-4 shadow-sm" : "rounded-full px-4"}
          >
            <Link
              href={
                managerName || role
                  ? `${item.href}?${new URLSearchParams({
                      ...(managerName ? { managerName } : {}),
                      ...(role ? { role } : {}),
                    }).toString()}`
                  : item.href
              }
            >
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
