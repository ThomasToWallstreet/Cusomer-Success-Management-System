import Link from "next/link";
import { Download } from "lucide-react";

import { importAssignmentCsvAction } from "@/app/(dashboard)/customer-management/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function ImportExportPanel({
  managerName,
  role,
  canEdit,
}: {
  managerName?: string;
  role: "supervisor" | "manager";
  canEdit: boolean;
}) {
  const exportHref = managerName
    ? `/customer-management/export?${new URLSearchParams({ managerName, role }).toString()}`
    : `/customer-management/export?${new URLSearchParams({ role }).toString()}`;

  return (
    <div className="rounded-lg border bg-card px-4 py-4">
      <h3 className="mb-3 text-base font-semibold tracking-tight">客户清单导入导出</h3>
      <div className="grid gap-4 md:grid-cols-2">
        {canEdit ? (
          <form action={importAssignmentCsvAction} className="space-y-2 rounded-md border bg-muted/20 p-3">
            <input type="hidden" name="role" value={role} />
            <Label htmlFor="file" className="text-sm font-medium">
              导入客户清单 CSV（将全量替换）
            </Label>
            <input id="file" name="file" type="file" accept=".csv,text/csv" required className="block w-full text-sm" />
            <p className="text-xs text-muted-foreground">
              模板需与生产表一致（双层表头），字段包含 25/26 订单业绩、增长率、阵型人员等完整列。
            </p>
            <Button type="submit">上传客户清单</Button>
          </form>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">当前为只读模式，新增/编辑/导入功能仅大客户服务主管可用。</p>
          </div>
        )}
        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
          {canEdit ? (
            <>
              <p className="text-sm text-muted-foreground">
                导出当前客户清单（UTF-8 with BOM，兼容 Windows 双击 Excel），可直接打开并回传。
              </p>
              <Button asChild variant="outline">
                <Link href={exportHref}>
                  <Download className="mr-2 h-4 w-4" />
                  导出客户清单
                </Link>
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">当前为只读模式，导出功能仅大客户服务主管可用。</p>
          )}
        </div>
      </div>
    </div>
  );
}
