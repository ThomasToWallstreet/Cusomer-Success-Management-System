import { AssignmentTable } from "@/components/customer/assignment-table";
import { ImportExportPanel } from "@/components/customer/import-export-panel";
import { listCustomerListEntries } from "@/lib/repos/customer-list-repo";
import { resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function CustomerManagementPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const role = parseViewerRole(getOne(query.role));
  const managerQuery = getOne(query.managerName);
  const { managerName } = await resolveCurrentManager(managerQuery, {
    allowAll: isSupervisorRole(role),
  });
  const scopedManagerName = isSupervisorRole(role)
    ? undefined
    : managerName && managerName !== "ALL"
      ? managerName
      : "__none__";
  const rows = await listCustomerListEntries(
    scopedManagerName ? { managerName: scopedManagerName } : undefined,
  );
  const canEdit = isSupervisorRole(role);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card px-5 py-4">
        <h2 className="text-xl font-semibold tracking-tight">客户管理（客户清单）</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canEdit
            ? "支持网页端新增/编辑/删除全字段，也支持通过 CSV 全量导入导出。"
            : "当前为经理只读模式，仅查看本人负责客户清单。"}
        </p>
      </div>

      {!canEdit ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          仅大客户服务主管可维护客户清单（新增、编辑、删除、导入、导出）。经理仅可查看本人负责内容。
        </div>
      ) : null}

      <ImportExportPanel managerName={scopedManagerName} role={role} canEdit={canEdit} />
      <AssignmentTable rows={rows} canEdit={canEdit} role={role} />
    </div>
  );
}
