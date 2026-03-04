import Link from "next/link";

import { AssignmentTable } from "@/components/customer/assignment-table";
import { CustomerContactTable } from "@/components/customer/customer-contact-table";
import { CustomerProjectTable } from "@/components/customer/customer-project-table";
import { CustomerScenarioTable } from "@/components/customer/customer-scenario-table";
import { ImportExportPanel } from "@/components/customer/import-export-panel";
import { listCustomerContacts } from "@/lib/repos/customer-contact-repo";
import { listCustomerProjectItems } from "@/lib/repos/customer-project-repo";
import { listCustomerScenarioItems } from "@/lib/repos/customer-scenario-repo";
import { listCustomerListEntries } from "@/lib/repos/customer-list-repo";
import { listCustomers, listCustomersByManager } from "@/lib/repos/customer-repo";
import { listCustomerIdsByManager, resolveCurrentManager } from "@/lib/repos/manager-assignment-repo";
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
  const rawTab = getOne(query.tab);
  const tab =
    rawTab === "contacts" || rawTab === "projects" || rawTab === "scenarios"
      ? rawTab
      : "customers";
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
  const allowedCustomerIds = isSupervisorRole(role)
    ? undefined
    : await listCustomerIdsByManager(managerName === "ALL" ? undefined : managerName);
  const [customerOptions, contactRows, projectRows, scenarioRows] = await Promise.all([
    isSupervisorRole(role)
      ? listCustomers()
      : listCustomersByManager(managerName === "ALL" ? undefined : managerName),
    listCustomerContacts({
      customerIds: allowedCustomerIds,
    }),
    listCustomerProjectItems({
      customerIds: allowedCustomerIds,
    }),
    listCustomerScenarioItems({
      customerIds: allowedCustomerIds,
    }),
  ]);
  const canEditCustomerList = isSupervisorRole(role);
  const canEditContacts = true;
  const baseQuery = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();
  const customerTabHref = `${baseQuery ? `/customer-management?${baseQuery}&` : "/customer-management?"}tab=customers`;
  const contactTabHref = `${baseQuery ? `/customer-management?${baseQuery}&` : "/customer-management?"}tab=contacts`;
  const projectTabHref = `${baseQuery ? `/customer-management?${baseQuery}&` : "/customer-management?"}tab=projects`;
  const scenarioTabHref = `${baseQuery ? `/customer-management?${baseQuery}&` : "/customer-management?"}tab=scenarios`;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border bg-card px-5 py-4">
        <h2 className="text-xl font-semibold tracking-tight">客户管理</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {canEditCustomerList
            ? "支持网页端新增/编辑/删除全字段，也支持通过 CSV 全量导入导出。"
            : "经理可查看本人负责客户清单，并维护对应客户关键人。"}
        </p>
      </div>

      {!canEditCustomerList ? (
        <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          仅大客户服务主管可维护客户清单（新增、编辑、删除、导入、导出）。经理仅可查看本人负责内容。
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={customerTabHref}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${tab === "customers" ? "border-primary bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
        >
          客户清单
        </Link>
        <Link
          href={contactTabHref}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${tab === "contacts" ? "border-primary bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
        >
          客户关键人清单
        </Link>
        <Link
          href={projectTabHref}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${tab === "projects" ? "border-primary bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
        >
          项目清单
        </Link>
        <Link
          href={scenarioTabHref}
          className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${tab === "scenarios" ? "border-primary bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted/30"}`}
        >
          场景清单
        </Link>
      </div>

      {tab === "customers" ? (
        <>
          <ImportExportPanel managerName={scopedManagerName} role={role} canEdit={canEditCustomerList} />
          <AssignmentTable rows={rows} canEdit={canEditCustomerList} role={role} />
        </>
      ) : tab === "contacts" ? (
        <CustomerContactTable
          rows={contactRows}
          customerOptions={customerOptions.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))}
          role={role}
          managerName={managerName}
          canEdit={canEditContacts}
        />
      ) : tab === "projects" ? (
        <CustomerProjectTable
          rows={projectRows}
          customerOptions={customerOptions.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))}
          role={role}
          managerName={managerName}
          canEdit={canEditContacts}
        />
      ) : (
        <CustomerScenarioTable
          rows={scenarioRows}
          customerOptions={customerOptions.map((item: { id: string; name: string }) => ({ id: item.id, name: item.name }))}
          role={role}
          managerName={managerName}
          canEdit={canEditContacts}
        />
      )}
    </div>
  );
}
