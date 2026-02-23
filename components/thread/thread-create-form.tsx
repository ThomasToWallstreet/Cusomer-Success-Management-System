import { createThreadAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ThreadCreateForm({
  ownerOptions,
  customerOptions,
  selectedCustomerId,
  managerName,
  role,
}: {
  ownerOptions: string[];
  customerOptions: Array<{ id: string; name: string }>;
  selectedCustomerId?: string;
  managerName?: string;
  role?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>新建客户成功计划</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createThreadAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="managerName" value={managerName || ""} />
          <input type="hidden" name="role" value={role || ""} />
          <div className="space-y-2">
            <Label htmlFor="customerId">选择已有客户</Label>
            <select
              id="customerId"
              name="customerId"
              defaultValue={selectedCustomerId || ""}
              className="h-9 w-full rounded-md border px-3 text-sm"
            >
              <option value="">-- 可选 --</option>
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">或输入新客户名称 *</Label>
            <Input id="customerName" name="customerName" placeholder="例如：某集团" list="customer-name-options" />
            <datalist id="customer-name-options">
              {customerOptions.map((customer) => (
                <option key={customer.id} value={customer.name} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyPerson">关键人 *</Label>
            <Input id="keyPerson" name="keyPerson" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="keyPersonDept">关键人部门</Label>
            <Input id="keyPersonDept" name="keyPersonDept" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner *</Label>
            <Input id="ownerName" name="ownerName" required list="owner-options" />
            <datalist id="owner-options">
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner} />
              ))}
            </datalist>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="keyProjectScenario">关键项目场景 *</Label>
            <Input id="keyProjectScenario" name="keyProjectScenario" required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="productLine">产品线</Label>
            <Input id="productLine" name="productLine" />
          </div>
          <div className="md:col-span-2">
            <Button type="submit">创建关键场景</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
