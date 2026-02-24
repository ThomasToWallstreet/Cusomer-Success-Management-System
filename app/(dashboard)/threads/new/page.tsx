import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ThreadCreateWorkflowForm } from "@/components/thread/thread-create-workflow-form";
import { Button } from "@/components/ui/button";
import { listCustomers, listCustomersByManager } from "@/lib/repos/customer-repo";
import { resolveCurrentManager, listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";
import { isSupervisorRole, parseViewerRole } from "@/lib/viewer-role";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function getOne(query: string | string[] | undefined) {
  return Array.isArray(query) ? query[0] : query;
}

export default async function ThreadNewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const query = await searchParams;
  const role = parseViewerRole(getOne(query.role));
  const selectedCustomerId = getOne(query.customerId);
  const managerNameQuery = getOne(query.managerName);
  const { managerName } = await resolveCurrentManager(managerNameQuery, {
    allowAll: isSupervisorRole(role),
  });
  const allowedCustomerIds = isSupervisorRole(role)
    ? undefined
    : await listCustomerIdsByManager(managerName === "ALL" ? undefined : managerName);
  const customers = await (isSupervisorRole(role)
    ? listCustomers()
    : listCustomersByManager(managerName === "ALL" ? undefined : managerName));
  const scopedCustomerId = selectedCustomerId &&
    (!allowedCustomerIds || allowedCustomerIds.includes(selectedCustomerId))
      ? selectedCustomerId
      : undefined;
  const backQuery = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();
  return (
    <div className="space-y-4">
      <Button variant="outline" asChild>
        <Link href={backQuery ? `/threads?${backQuery}` : "/threads"}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回客户成功计划
        </Link>
      </Button>
      <ThreadCreateWorkflowForm
        customerOptions={customers}
        selectedCustomerId={scopedCustomerId}
        managerName={managerName}
        role={role}
      />
    </div>
  );
}
