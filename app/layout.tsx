import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  title: "深圳区KA客户成功管理系统",
  description: "一期MVP - 关键场景与周报管理",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className="antialiased"
        style={
          {
            "--font-geist-sans":
              'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
            "--font-geist-mono":
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          } as CSSProperties
        }
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
