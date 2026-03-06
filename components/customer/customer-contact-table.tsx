"use client";

import { History, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import {
  createCustomerContactAction,
  deleteCustomerContactAction,
  updateCustomerContactSatisfactionAction,
  updateCustomerContactAction,
} from "@/app/(dashboard)/customer-management/actions";
import { CustomerContactForm } from "@/components/customer/customer-contact-form";
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

type ContactRow = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  name: string;
  department: string | null;
  level: string | null;
  satisfactionCurrent: string;
  satisfactionTarget: string;
  satisfactionUpdatedAt: Date | string | null;
  satisfactionEvidence: string | null;
  satisfactionHistories?: Array<{
    id: string;
    satisfactionCurrent: string;
    satisfactionUpdatedAt: Date | string;
    satisfactionEvidence: string;
    createdAt: Date | string;
  }>;
  note: string | null;
  updatedAt: Date | string;
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

export function CustomerContactTable({
  rows,
  customerOptions,
  role,
  managerName,
  canEdit,
}: {
  rows: ContactRow[];
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
                新增关键人
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl" data-no-drag-scroll="true">
              <DialogHeader>
                <DialogTitle>新增客户关键人</DialogTitle>
                <DialogDescription>关键人归属于客户主数据，可在新增客户成功计划时直接关联。</DialogDescription>
              </DialogHeader>
              <CustomerContactForm
                mode="create"
                role={role}
                managerName={managerName}
                customerOptions={customerOptions}
                submitLabel="保存关键人"
                action={createCustomerContactAction}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
      <DragScrollContainer showHint>
        <table className="w-full min-w-[980px] text-[13px] leading-5">
          <thead className="bg-muted/40">
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-center [&>th]:align-middle [&>th]:font-semibold [&>th:last-child]:border-r-0">
              <th>客户名称</th>
              <th>关键人姓名</th>
              <th>部门</th>
              <th>层级</th>
              <th>满意度现状</th>
              <th>满意度目标</th>
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
                  <td>{row.department || "-"}</td>
                  <td>{row.level || "-"}</td>
                  <td>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center justify-center gap-2">
                        <span>{row.satisfactionCurrent || "-"}</span>
                        {canEdit ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" data-no-drag-scroll="true" aria-label="更新满意度现状">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg" data-no-drag-scroll="true">
                              <DialogHeader>
                                <DialogTitle>更新满意度现状</DialogTitle>
                                <DialogDescription>更新后将全局生效，并同步展示到客户成功-组织关系。</DialogDescription>
                              </DialogHeader>
                              <form action={updateCustomerContactSatisfactionAction} className="space-y-3">
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="role" value={role} />
                                <input type="hidden" name="managerName" value={managerName || ""} />
                                <div className="space-y-2">
                                  <Label htmlFor={`satisfaction-current-${row.id}`}>满意度现状</Label>
                                  <select
                                    id={`satisfaction-current-${row.id}`}
                                    name="satisfactionCurrent"
                                    defaultValue={row.satisfactionCurrent || "无感知"}
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    required
                                  >
                                    <option value="认可">认可</option>
                                    <option value="一般">一般</option>
                                    <option value="无感知">无感知</option>
                                    <option value="不满意">不满意</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`satisfaction-updated-at-${row.id}`}>满意度更新时间</Label>
                                  <Input
                                    id={`satisfaction-updated-at-${row.id}`}
                                    name="satisfactionUpdatedAt"
                                    type="datetime-local"
                                    defaultValue={toDateTimeLocalValue(row.satisfactionUpdatedAt)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`satisfaction-evidence-${row.id}`}>更新举证</Label>
                                  <Textarea
                                    id={`satisfaction-evidence-${row.id}`}
                                    name="satisfactionEvidence"
                                    rows={3}
                                    defaultValue={row.satisfactionEvidence || ""}
                                    required
                                  />
                                </div>
                                <div className="rounded-md border bg-muted/20 p-3">
                                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <History className="h-3.5 w-3.5" />
                                    历史记录
                                  </p>
                                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {(row.satisfactionHistories || []).length ? (
                                      (row.satisfactionHistories || []).map((history) => (
                                        <div key={history.id} className="rounded border bg-background px-2 py-1.5 text-xs">
                                          <p>
                                            现状：{history.satisfactionCurrent} ｜ 时间：{formatDateTimeCST(history.satisfactionUpdatedAt)}
                                          </p>
                                          <p className="text-muted-foreground">举证：{history.satisfactionEvidence}</p>
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
                        更新时间：{row.satisfactionUpdatedAt ? formatDateTimeCST(row.satisfactionUpdatedAt) : "-"}
                      </p>
                    </div>
                  </td>
                  <td>{row.satisfactionTarget || "-"}</td>
                  <td title={row.note || "-"} className="max-w-[280px] whitespace-pre-wrap break-words text-left align-top">
                    {row.note || "-"}
                  </td>
                  {canEdit ? (
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="编辑关键人" data-no-drag-scroll="true">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl" data-no-drag-scroll="true">
                            <DialogHeader>
                              <DialogTitle>编辑客户关键人</DialogTitle>
                              <DialogDescription>更新后会同步影响新增计划时的关键人选择。</DialogDescription>
                            </DialogHeader>
                            <CustomerContactForm
                              mode="edit"
                              role={role}
                              managerName={managerName}
                              customerOptions={customerOptions}
                              submitLabel="保存修改"
                              action={updateCustomerContactAction}
                              defaultValues={{
                                id: row.id,
                                customerId: row.customerId,
                                name: row.name,
                                department: row.department,
                                level: row.level,
                                note: row.note,
                                satisfactionCurrent: (row.satisfactionCurrent as "认可" | "一般" | "无感知" | "不满意") || "无感知",
                                satisfactionTarget: (row.satisfactionTarget as "认可" | "一般" | "无感知" | "不满意") || "认可",
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <form action={deleteCustomerContactAction} data-no-drag-scroll="true" className="flex justify-center">
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="role" value={role} />
                          <input type="hidden" name="managerName" value={managerName || ""} />
                          <Button type="submit" variant="ghost" size="icon" aria-label="删除关键人" data-no-drag-scroll="true">
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
                <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-sm text-muted-foreground">
                  暂无关键人数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DragScrollContainer>
    </div>
  );
}
