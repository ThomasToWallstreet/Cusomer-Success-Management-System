import { exportCustomerListCsv } from "@/lib/repos/customer-list-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = parseViewerRole(searchParams.get("role"));
  if (!isSupervisorRole(role)) {
    return new Response("仅大客户服务主管可导出客户清单", { status: 403 });
  }
  const managerNameRaw = searchParams.get("managerName") || undefined;
  const managerName = managerNameRaw === "ALL" ? undefined : managerNameRaw;
  const csv = await exportCustomerListCsv(managerName ? { managerName } : undefined);
  const csvWithBom = `\uFEFF${csv}`;

  return new Response(csvWithBom, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customer-list.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
