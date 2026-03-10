"use client";

import Link from "next/link";
import { History, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import {
  createCustomerScenarioAction,
  deleteCustomerScenarioAction,
  updateCustomerScenarioAction,
  updateCustomerScenarioAlignmentAction,
} from "@/app/(dashboard)/customer-management/actions";
import { CustomerScenarioForm } from "@/components/customer/customer-scenario-form";
import { DragScrollContainer } from "@/components/shared/drag-scroll-container";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeCST } from "@/lib/datetime";

type ScenarioRow = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  name: string;
  keyScenarioDescription: string | null;
  businessNeedAnalysis: string | null;
  personalNeeds: string | null;
  smartGoal: string | null;
  alignedWithCustomer: string | null;
  alignedUpdatedAt: Date | string | null;
  alignedEvidence: string | null;
  alignmentHistories?: Array<{
    id: string;
    alignedWithCustomer: string;
    alignedUpdatedAt: Date | string;
    alignedEvidence: string;
    createdAt: Date | string;
  }>;
  attachments?: Array<{
    id: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
  }>;
  note: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
};

function toDateTimeLocalValue(value?: Date | string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

export function CustomerScenarioTable({
  rows,
  customerOptions,
  role,
  managerName,
  canEdit,
}: {
  rows: ScenarioRow[];
  customerOptions: CustomerOption[];
  role: "supervisor" | "manager";
  managerName?: string;
  canEdit: boolean;
}) {
  return (
    <div className="space-y-3 overflow-hidden rounded-lg border bg-card p-3">
      {canEdit ? (
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新增场景
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl" data-no-drag-scroll="true">
              <DialogHeader>
                <DialogTitle>新增关键场景清单</DialogTitle>
                <DialogDescription>用于新建客户成功计划时关联“客户成功-价值兑现”主数据。</DialogDescription>
              </DialogHeader>
              <CustomerScenarioForm
                mode="create"
                role={role}
                managerName={managerName}
                customerOptions={customerOptions}
                submitLabel="保存场景"
                action={createCustomerScenarioAction}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      <DragScrollContainer showHint>
        <table className="w-full min-w-[1460px] text-[13px] leading-5">
          <thead className="bg-muted/40">
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-center [&>th]:align-middle [&>th]:font-semibold [&>th:last-child]:border-r-0">
              <th>客户名称</th>
              <th>场景名称</th>
              <th>关键场景说明</th>
              <th>客户业务需求分析</th>
              <th>关键人的个人需求</th>
              <th>客户成功目标（SMART）</th>
              <th>是否与客户完成对齐</th>
              <th>备注</th>
              {canEdit ? <th>操作</th> : null}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border/60 transition-colors hover:bg-muted/30 [&>td]:border-r [&>td]:border-border/50 [&>td]:px-2 [&>td]:py-2.5 [&>td]:text-center [&>td]:align-middle [&>td:last-child]:border-r-0"
                >
                  <td className="text-left">{row.customer.name}</td>
                  <td className="font-medium">{row.name}</td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.keyScenarioDescription || "-"}</td>
                  <td className="max-w-[260px] whitespace-pre-wrap break-words text-left align-top">
                    <div>{row.businessNeedAnalysis || "-"}</div>
                    {(row.attachments || []).length ? (
                      <div className="mt-2 space-y-1 border-t border-border/60 pt-2 text-xs">
                        {(row.attachments || []).map((attachment) => (
                          <div key={attachment.id}>
                            <Link href={attachment.fileUrl} target="_blank" className="text-primary underline-offset-2 hover:underline">
                              {attachment.originalName}
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.personalNeeds || "-"}</td>
                  <td className="max-w-[320px] whitespace-pre-wrap break-words text-left align-top">{row.smartGoal || "-"}</td>
                  <td>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span>{row.alignedWithCustomer || "-"}</span>
                        {canEdit ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" data-no-drag-scroll="true" aria-label="更新是否与客户完成对齐">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg" data-no-drag-scroll="true">
                              <DialogHeader>
                                <DialogTitle>更新是否与客户完成对齐</DialogTitle>
                                <DialogDescription>更新后将全局生效，并同步展示到客户成功计划详情。</DialogDescription>
                              </DialogHeader>
                              <form action={updateCustomerScenarioAlignmentAction} className="space-y-3">
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="role" value={role} />
                                <input type="hidden" name="managerName" value={managerName || ""} />
                                <div className="space-y-2">
                                  <Label htmlFor={`aligned-with-customer-${row.id}`}>是否与客户完成对齐</Label>
                                  <select
                                    id={`aligned-with-customer-${row.id}`}
                                    name="alignedWithCustomer"
                                    defaultValue={row.alignedWithCustomer || "否-未对齐"}
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    required
                                  >
                                    <option value="是-充分对齐">是-充分对齐</option>
                                    <option value="是-部分对齐">是-部分对齐</option>
                                    <option value="否-未对齐">否-未对齐</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`aligned-updated-at-${row.id}`}>对齐更新时间</Label>
                                  <Input
                                    id={`aligned-updated-at-${row.id}`}
                                    name="alignedUpdatedAt"
                                    type="datetime-local"
                                    defaultValue={toDateTimeLocalValue(row.alignedUpdatedAt)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`aligned-evidence-${row.id}`}>更新举证</Label>
                                  <Textarea
                                    id={`aligned-evidence-${row.id}`}
                                    name="alignedEvidence"
                                    rows={3}
                                    defaultValue={row.alignedEvidence || ""}
                                    required
                                  />
                                </div>
                                <div className="rounded-md border bg-muted/20 p-3">
                                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <History className="h-3.5 w-3.5" />
                                    历史记录
                                  </p>
                                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {(row.alignmentHistories || []).length ? (
                                      (row.alignmentHistories || []).map((history) => (
                                        <div key={history.id} className="rounded border bg-background px-2 py-1.5 text-xs">
                                          <p>
                                            结果：{history.alignedWithCustomer} ｜ 时间：{formatDateTimeCST(history.alignedUpdatedAt)}
                                          </p>
                                          <p className="text-muted-foreground">举证：{history.alignedEvidence}</p>
                                        </div>
                                      ))
                                    ) : (
                                      <p className="text-xs text-muted-foreground">暂无历史记录</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-end">
                                  <Button type="submit">保存更新</Button>
                                </div>
                              </form>
                            </DialogContent>
                          </Dialog>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        更新时间：{row.alignedUpdatedAt ? formatDateTimeCST(row.alignedUpdatedAt) : "-"}
                      </p>
                    </div>
                  </td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.note || "-"}</td>
                  {canEdit ? (
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="编辑场景" data-no-drag-scroll="true">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl" data-no-drag-scroll="true">
                            <DialogHeader>
                              <DialogTitle>编辑关键场景清单</DialogTitle>
                              <DialogDescription>更新后可在新建客户成功计划中直接关联。</DialogDescription>
                            </DialogHeader>
                            <CustomerScenarioForm
                              mode="edit"
                              role={role}
                              managerName={managerName}
                              customerOptions={customerOptions}
                              submitLabel="保存修改"
                              action={updateCustomerScenarioAction}
                              defaultValues={{
                                id: row.id,
                                customerId: row.customerId,
                                name: row.name,
                                keyScenarioDescription: row.keyScenarioDescription,
                                businessNeedAnalysis: row.businessNeedAnalysis,
                                personalNeeds: row.personalNeeds,
                                smartGoal: row.smartGoal,
                                alignedWithCustomer: row.alignedWithCustomer,
                                note: row.note,
                                attachments: row.attachments,
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <form action={deleteCustomerScenarioAction} data-no-drag-scroll="true" className="flex justify-center">
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="role" value={role} />
                          <input type="hidden" name="managerName" value={managerName || ""} />
                          <Button type="submit" variant="ghost" size="icon" aria-label="删除场景" data-no-drag-scroll="true">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={canEdit ? 9 : 8} className="py-8 text-center text-sm text-muted-foreground">
                  暂无关键场景清单数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DragScrollContainer>
    </div>
  );
}
