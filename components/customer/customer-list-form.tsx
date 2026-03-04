"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type CustomerListFormValues = {
  id?: string;
  customerName?: string | null;
  groupBranch?: string | null;
  industry?: string | null;
  customerType?: string | null;
  customerStage?: string | null;
  annualCapacity?: string | null;
  order25?: string | null;
  performance25?: string | null;
  order26?: string | null;
  performance26?: string | null;
  growthOrder?: string | null;
  growthPerformance?: string | null;
  sales?: string | null;
  preSalesSecurity?: string | null;
  preSalesCloud?: string | null;
  accountServiceManager?: string | null;
  remark?: string | null;
};

type Props = {
  mode: "create" | "edit";
  role: "supervisor" | "manager";
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  defaultValues?: CustomerListFormValues;
};

function textOrEmpty(value?: string | null) {
  return value ?? "";
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "保存中..." : label}</Button>;
}

export function CustomerListForm({ mode, role, submitLabel, action, defaultValues }: Props) {
  return (
    <form action={action} className="space-y-4" data-no-drag-scroll="true">
      <input type="hidden" name="role" value={role} />
      {mode === "edit" && defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-customerName`}>客户名称 *</Label>
          <Input id={`${mode}-customerName`} name="customerName" defaultValue={textOrEmpty(defaultValues?.customerName)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-accountServiceManager`}>大客户服务经理</Label>
          <Input
            id={`${mode}-accountServiceManager`}
            name="accountServiceManager"
            defaultValue={textOrEmpty(defaultValues?.accountServiceManager)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-groupBranch`}>集团客户重点分支（支持分行）</Label>
        <Textarea
          id={`${mode}-groupBranch`}
          name="groupBranch"
          defaultValue={textOrEmpty(defaultValues?.groupBranch)}
          rows={3}
          placeholder="可输入多行分支信息"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-industry`}>行业</Label>
          <Input id={`${mode}-industry`} name="industry" defaultValue={textOrEmpty(defaultValues?.industry)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-customerType`}>客户类型</Label>
          <Input id={`${mode}-customerType`} name="customerType" defaultValue={textOrEmpty(defaultValues?.customerType)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-customerStage`}>阶段</Label>
          <Input id={`${mode}-customerStage`} name="customerStage" defaultValue={textOrEmpty(defaultValues?.customerStage)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-annualCapacity`}>年产能估算</Label>
          <Input id={`${mode}-annualCapacity`} name="annualCapacity" defaultValue={textOrEmpty(defaultValues?.annualCapacity)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-order25`}>25订单</Label>
          <Input id={`${mode}-order25`} name="order25" defaultValue={textOrEmpty(defaultValues?.order25)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-performance25`}>25业绩</Label>
          <Input id={`${mode}-performance25`} name="performance25" defaultValue={textOrEmpty(defaultValues?.performance25)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-order26`}>26订单</Label>
          <Input id={`${mode}-order26`} name="order26" defaultValue={textOrEmpty(defaultValues?.order26)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-performance26`}>26业绩</Label>
          <Input id={`${mode}-performance26`} name="performance26" defaultValue={textOrEmpty(defaultValues?.performance26)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-growthOrder`}>增长率-订单</Label>
          <Input id={`${mode}-growthOrder`} name="growthOrder" defaultValue={textOrEmpty(defaultValues?.growthOrder)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-growthPerformance`}>增长率-业绩</Label>
          <Input
            id={`${mode}-growthPerformance`}
            name="growthPerformance"
            defaultValue={textOrEmpty(defaultValues?.growthPerformance)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-sales`}>销售</Label>
          <Input id={`${mode}-sales`} name="sales" defaultValue={textOrEmpty(defaultValues?.sales)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-preSalesSecurity`}>售前（安全）</Label>
          <Input id={`${mode}-preSalesSecurity`} name="preSalesSecurity" defaultValue={textOrEmpty(defaultValues?.preSalesSecurity)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-preSalesCloud`}>售前（云）</Label>
          <Input id={`${mode}-preSalesCloud`} name="preSalesCloud" defaultValue={textOrEmpty(defaultValues?.preSalesCloud)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-remark`}>备注</Label>
          <Textarea id={`${mode}-remark`} name="remark" defaultValue={textOrEmpty(defaultValues?.remark)} rows={2} />
        </div>
      </div>

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
