"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "仪表盘" },
  { href: "/customer-management", label: "客户管理" },
  { href: "/threads", label: "客户成功计划" },
  { href: "/weekly-reports", label: "周报" },
  { href: "/my-account", label: "我的账号" },
];

export function TopNav({ showAccountAdmin }: { showAccountAdmin: boolean }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const managerName = searchParams.get("managerName");

  const items = showAccountAdmin
    ? [...navItems, { href: "/account-management", label: "账号管理" }]
    : navItems;

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
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
                managerName && item.href !== "/account-management" && item.href !== "/my-account"
                  ? `${item.href}?${new URLSearchParams({ managerName }).toString()}`
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
