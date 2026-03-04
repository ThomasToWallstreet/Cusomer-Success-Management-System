"use client";

import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CustomerOption = {
  id: string;
  name: string;
};

const alignedWithCustomerOptions = ["是-充分对齐", "是-部分对齐", "否-未对齐"] as const;

export type CustomerScenarioFormValues = {
  id?: string;
  customerId?: string;
  name?: string | null;
  businessNeedAnalysis?: string | null;
  personalNeeds?: string | null;
  smartGoal?: string | null;
  alignedWithCustomer?: string | null;
  note?: string | null;
};

type Props = {
  mode: "create" | "edit";
  role: "supervisor" | "manager";
  managerName?: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  customerOptions: CustomerOption[];
  defaultValues?: CustomerScenarioFormValues;
};

function textOrEmpty(value?: string | null) {
  return value ?? "";
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "保存中..." : label}</Button>;
}

export function CustomerScenarioForm({
  mode,
  role,
  managerName,
  submitLabel,
  action,
  customerOptions,
  defaultValues,
}: Props) {
  return (
    <form action={action} className="space-y-4" data-no-drag-scroll="true">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="managerName" value={managerName || ""} />
      {mode === "edit" && defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-scenario-customer`}>所属客户 *</Label>
          <select
            id={`${mode}-scenario-customer`}
            name="customerId"
            defaultValue={defaultValues?.customerId || ""}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            required
          >
            <option value="">请选择客户</option>
            {customerOptions.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-scenario-name`}>场景名称 *</Label>
          <Input id={`${mode}-scenario-name`} name="name" defaultValue={textOrEmpty(defaultValues?.name)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-business-need`}>客户业务需求分析</Label>
        <Textarea
          id={`${mode}-business-need`}
          name="businessNeedAnalysis"
          rows={3}
          defaultValue={textOrEmpty(defaultValues?.businessNeedAnalysis)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-personal-needs`}>关键人的个人需求</Label>
        <Textarea
          id={`${mode}-personal-needs`}
          name="personalNeeds"
          rows={3}
          defaultValue={textOrEmpty(defaultValues?.personalNeeds)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-smart-goal`}>客户成功目标（SMART）</Label>
        <Textarea id={`${mode}-smart-goal`} name="smartGoal" rows={3} defaultValue={textOrEmpty(defaultValues?.smartGoal)} />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-aligned`}>是否与客户完成对齐</Label>
        <select
          id={`${mode}-aligned`}
          name="alignedWithCustomer"
          defaultValue={textOrEmpty(defaultValues?.alignedWithCustomer)}
          className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        >
          <option value="">请选择</option>
          {alignedWithCustomerOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-scenario-note`}>备注</Label>
        <Textarea id={`${mode}-scenario-note`} name="note" rows={2} defaultValue={textOrEmpty(defaultValues?.note)} />
      </div>

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
