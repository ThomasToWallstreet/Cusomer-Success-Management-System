"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type CustomerOption = {
  id: string;
  name: string;
};

type ScenarioAttachmentValue = {
  id: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
};

const alignedWithCustomerOptions = ["是-充分对齐", "是-部分对齐", "否-未对齐"] as const;
const smartGuideText = `S - Specific (明确的/具体的)
目标必须清晰、明确，不能笼统。要说明要达成的行为标准。
示例： 不是“提高销售额”，而是“提升A产品在华北地区的销售额”。
M - Measurable (可衡量的/可量化)
目标应该是数量化或行为化的，验证指标的数据可获得，以便考核进度。
示例： “销售额比去年提升 15%”。
A - Attainable (可达成的/可实现的)
目标需要具有挑战性，但要付出努力后是可以实现的，避免设立过高或过低的目标。
示例： 在现有 10% 增长基础上，通过增加渠道，将目标定为提升 15%，而非盲目定为 100%。
R - Relevant (相关性)
目标必须与其他长远目标、公司战略或个人职责相关联，有明确的价值。
示例： 销售目标应直接相关联“增加部门年营收”的核心工作，而不是去做不相关的行政事宜。
T - Time-bound (有时限的/截止期限)
注重完成目标的时间限制，明确具体截止日期，避免拖延。`;

export type CustomerScenarioFormValues = {
  id?: string;
  customerId?: string;
  name?: string | null;
  keyScenarioDescription?: string | null;
  businessNeedAnalysis?: string | null;
  personalNeeds?: string | null;
  smartGoal?: string | null;
  alignedWithCustomer?: string | null;
  note?: string | null;
  attachments?: ScenarioAttachmentValue[];
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

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
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
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);

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
        <Label htmlFor={`${mode}-key-scenario-description`}>关键场景说明</Label>
        <Textarea
          id={`${mode}-key-scenario-description`}
          name="keyScenarioDescription"
          rows={3}
          defaultValue={textOrEmpty(defaultValues?.keyScenarioDescription)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Label htmlFor={`${mode}-business-need`}>客户业务需求分析</Label>
          <input
            id={`${mode}-attachments`}
            name="attachments"
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt"
            onChange={(event) => {
              const files = Array.from(event.target.files || []);
              setSelectedFileNames(files.map((file) => file.name));
            }}
          />
          <Button type="button" variant="outline" size="sm" asChild>
            <label htmlFor={`${mode}-attachments`} className="cursor-pointer">
              <Paperclip className="mr-1 h-4 w-4" />
              上传附件
            </label>
          </Button>
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>上传关键场景相关附件</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id={`${mode}-business-need`}
          name="businessNeedAnalysis"
          rows={3}
          defaultValue={textOrEmpty(defaultValues?.businessNeedAnalysis)}
        />
        <p className="text-xs text-muted-foreground">支持上传 PDF、Word、Excel、图片、TXT，单个文件不超过 10MB，最多 10 个。</p>
        {selectedFileNames.length ? (
          <div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
            已选择：{selectedFileNames.join("、")}
          </div>
        ) : null}
        {(defaultValues?.attachments || []).length ? (
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-xs font-medium text-foreground">已上传附件</p>
            <div className="mt-2 space-y-1 text-xs">
              {(defaultValues?.attachments || []).map((attachment) => (
                <div key={attachment.id}>
                  <Link href={attachment.fileUrl} target="_blank" className="text-primary underline-offset-2 hover:underline">
                    {attachment.originalName}
                  </Link>
                  <span className="ml-2 text-muted-foreground">{formatFileSize(attachment.fileSize)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
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
        <Textarea id={`${mode}-smart-goal`} name="smartGoal" rows={5} defaultValue={textOrEmpty(defaultValues?.smartGoal)} />
        <div className="rounded-md border bg-muted/20 p-3 text-xs leading-6 text-muted-foreground whitespace-pre-wrap">
          {smartGuideText}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${mode}-aligned`}>是否与客户完成对齐</Label>
        {mode === "edit" ? (
          <>
            <Input
              id={`${mode}-aligned`}
              value={textOrEmpty(defaultValues?.alignedWithCustomer) || "否-未对齐"}
              readOnly
              className="h-9 w-full rounded-md border bg-muted/30 px-3 text-sm"
            />
            <input type="hidden" name="alignedWithCustomer" value={textOrEmpty(defaultValues?.alignedWithCustomer)} />
            <p className="text-xs text-muted-foreground">请使用“是否与客户完成对齐”列右侧更新图标进行增量更新并保留历史。</p>
          </>
        ) : (
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
        )}
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
