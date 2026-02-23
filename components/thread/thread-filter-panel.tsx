import Link from "next/link";
import { stageOptions } from "@/lib/constants/domain";
import { riskLevelOptions } from "@/lib/constants/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  owners: string[];
  customers: Array<{ id: string; name: string }>;
  current: Record<string, string | undefined>;
  managerName?: string;
  role?: string;
};

export function ThreadFilterPanel({ owners, customers, current, managerName, role }: Props) {
  const resetQuery = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();
  return (
    <form className="space-y-4 rounded-lg border bg-card p-4">
      <input type="hidden" name="managerName" value={managerName || ""} />
      <input type="hidden" name="role" value={role || ""} />
      <div className="space-y-2">
        <Label htmlFor="keyword">关键字</Label>
        <Input id="keyword" name="keyword" defaultValue={current.keyword} placeholder="客户/关键人/场景/NextAction" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customerId">客户</Label>
        <Select name="customerId" defaultValue={current.customerId || "ALL"}>
          <SelectTrigger id="customerId">
            <SelectValue placeholder="全部客户" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部客户</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="ownerName">Owner</Label>
        <Input id="ownerName" name="ownerName" defaultValue={current.ownerName} list="owner-options" />
        <datalist id="owner-options">
          {owners.map((owner) => (
            <option key={owner} value={owner} />
          ))}
        </datalist>
      </div>
      <div className="space-y-2">
        <Label>阶段</Label>
        <Select name="stage" defaultValue={current.stage || "ALL"}>
          <SelectTrigger>
            <SelectValue placeholder="全部阶段" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部阶段</SelectItem>
            {stageOptions.map((stage) => (
              <SelectItem key={stage.value} value={stage.value}>
                {stage.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>风险</Label>
        <Select name="riskLevel" defaultValue={current.riskLevel || "ALL"}>
          <SelectTrigger>
            <SelectValue placeholder="全部风险" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">全部风险</SelectItem>
            {riskLevelOptions.map((risk) => (
              <SelectItem key={risk.value} value={risk.value}>
                {risk.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="w-full">
          筛选
        </Button>
        <Button type="button" variant="outline" className="w-full" asChild>
          <Link href={resetQuery ? `/threads?${resetQuery}` : "/threads"}>重置</Link>
        </Button>
      </div>
    </form>
  );
}
