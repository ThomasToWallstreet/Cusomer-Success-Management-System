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

export type CustomerContactFormValues = {
  id?: string;
  customerId?: string;
  name?: string | null;
  department?: string | null;
  level?: string | null;
  note?: string | null;
  satisfactionCurrent?: "认可" | "一般" | "无感知" | "不满意" | null;
  satisfactionTarget?: "认可" | "一般" | "无感知" | "不满意" | null;
};

type Props = {
  mode: "create" | "edit";
  role: "supervisor" | "manager";
  managerName?: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  customerOptions: CustomerOption[];
  defaultValues?: CustomerContactFormValues;
};

function textOrEmpty(value?: string | null) {
  return value ?? "";
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "保存中..." : label}</Button>;
}

export function CustomerContactForm({
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

      <div className="space-y-2">
        <Label htmlFor={`${mode}-contact-customer`}>所属客户 *</Label>
        <select
          id={`${mode}-contact-customer`}
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

      <div className="grid gap-3 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-contact-name`}>关键人姓名 *</Label>
          <Input id={`${mode}-contact-name`} name="name" defaultValue={textOrEmpty(defaultValues?.name)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-contact-department`}>部门</Label>
          <Input id={`${mode}-contact-department`} name="department" defaultValue={textOrEmpty(defaultValues?.department)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-contact-level`}>层级</Label>
          <Input id={`${mode}-contact-level`} name="level" defaultValue={textOrEmpty(defaultValues?.level)} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-contact-current`}>满意度现状</Label>
          {mode === "edit" ? (
            <>
              <Input
                id={`${mode}-contact-current`}
                value={defaultValues?.satisfactionCurrent || "无感知"}
                readOnly
                className="h-9 w-full rounded-md border bg-muted/30 px-3 text-sm"
              />
              <input type="hidden" name="satisfactionCurrent" value={defaultValues?.satisfactionCurrent || "无感知"} />
              <p className="text-xs text-muted-foreground">请使用“满意度现状”列右侧更新图标进行增量更新并保留历史。</p>
            </>
          ) : (
            <select
              id={`${mode}-contact-current`}
              name="satisfactionCurrent"
              defaultValue={defaultValues?.satisfactionCurrent || "无感知"}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="认可">认可</option>
              <option value="一般">一般</option>
              <option value="无感知">无感知</option>
              <option value="不满意">不满意</option>
            </select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-contact-target`}>满意度目标</Label>
          <select
            id={`${mode}-contact-target`}
            name="satisfactionTarget"
            defaultValue={defaultValues?.satisfactionTarget || "认可"}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="认可">认可</option>
            <option value="一般">一般</option>
            <option value="无感知">无感知</option>
            <option value="不满意">不满意</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-contact-note`}>备注</Label>
        <Textarea id={`${mode}-contact-note`} name="note" rows={2} defaultValue={textOrEmpty(defaultValues?.note)} />
      </div>

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
