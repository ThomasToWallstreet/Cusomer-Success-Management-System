"use client";

import { useFormStatus } from "react-dom";

import { businessStageOptions } from "@/lib/constants/domain";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type CustomerOption = {
  id: string;
  name: string;
};

const productLineOptions = [
  "AC",
  "AF",
  "AD",
  "aDesk",
  "XDR",
  "aES",
  "安全服务",
  "MSS",
  "GPT",
  "HCI",
  "aTrust",
  "SIP",
  "SASE",
  "EDS",
  "AI安全平台",
  "SG",
  "SDDC",
  "CSSP",
  "VPN",
] as const;

const targetDimensionOptions = ["复购", "新业务突破", "续约"] as const;
const businessGoalResultOptions = [
  "复购已下单",
  "复购机会已立项",
  "续费已达成",
  "突破业务价值已兑现",
  "未达成",
] as const;

export type CustomerProjectFormValues = {
  id?: string;
  customerId?: string;
  name?: string | null;
  productLine?: string | null;
  targetDimension?: string[] | null;
  targetDescription?: string | null;
  businessStage?: string | null;
  businessGoalAchieved?: string | null;
  keyScenarioDescription?: string | null;
  note?: string | null;
};

type Props = {
  mode: "create" | "edit";
  role: "supervisor" | "manager";
  managerName?: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  customerOptions: CustomerOption[];
  defaultValues?: CustomerProjectFormValues;
};

function textOrEmpty(value?: string | null) {
  return value ?? "";
}

function parseCsv(value?: string | null) {
  if (!value) return [] as string[];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? "保存中..." : label}</Button>;
}

export function CustomerProjectForm({
  mode,
  role,
  managerName,
  submitLabel,
  action,
  customerOptions,
  defaultValues,
}: Props) {
  const selectedProductLines = parseCsv(defaultValues?.productLine);
  const selectedTargetDimensions = defaultValues?.targetDimension || [];

  return (
    <form action={action} className="space-y-4" data-no-drag-scroll="true">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="managerName" value={managerName || ""} />
      {mode === "edit" && defaultValues?.id ? <input type="hidden" name="id" value={defaultValues.id} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-project-customer`}>所属客户 *</Label>
          <select
            id={`${mode}-project-customer`}
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
          <Label htmlFor={`${mode}-project-name`}>项目名称 *</Label>
          <Input id={`${mode}-project-name`} name="name" defaultValue={textOrEmpty(defaultValues?.name)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>产品线（多选）</Label>
        <div className="grid gap-2 md:grid-cols-4">
          {productLineOptions.map((option) => (
            <label key={`${mode}-product-line-${option}`} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="productLine" value={option} defaultChecked={selectedProductLines.includes(option)} />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>目标维度（多选）</Label>
        <div className="flex flex-wrap gap-3">
          {targetDimensionOptions.map((option) => (
            <label key={`${mode}-target-dimension-${option}`} className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="targetDimension"
                value={option}
                defaultChecked={selectedTargetDimensions.includes(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${mode}-business-stage`}>业务阶段</Label>
          <select
            id={`${mode}-business-stage`}
            name="businessStage"
            defaultValue={textOrEmpty(defaultValues?.businessStage)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
          >
            <option value="">请选择</option>
            {businessStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${mode}-business-goal-achieved`}>经营目标是否达成</Label>
          {mode === "edit" ? (
            <>
              <Input
                id={`${mode}-business-goal-achieved`}
                value={textOrEmpty(defaultValues?.businessGoalAchieved) || "未达成"}
                readOnly
                className="h-9 w-full rounded-md border bg-muted/30 px-3 text-sm"
              />
              <input type="hidden" name="businessGoalAchieved" value={textOrEmpty(defaultValues?.businessGoalAchieved)} />
              <p className="text-xs text-muted-foreground">请使用“经营目标是否达成”列右侧更新图标进行增量更新并保留历史。</p>
            </>
          ) : (
            <select
              id={`${mode}-business-goal-achieved`}
              name="businessGoalAchieved"
              defaultValue={textOrEmpty(defaultValues?.businessGoalAchieved)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            >
              <option value="">请选择</option>
              {businessGoalResultOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-target-description`}>目标描述</Label>
        <Textarea
          id={`${mode}-target-description`}
          name="targetDescription"
          rows={3}
          defaultValue={textOrEmpty(defaultValues?.targetDescription)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-key-scenario-description`}>关键场景说明</Label>
        <Textarea
          id={`${mode}-key-scenario-description`}
          name="keyScenarioDescription"
          rows={3}
          defaultValue={textOrEmpty(defaultValues?.keyScenarioDescription)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-project-note`}>备注</Label>
        <Textarea id={`${mode}-project-note`} name="note" rows={2} defaultValue={textOrEmpty(defaultValues?.note)} />
      </div>

      <div className="flex justify-end">
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
