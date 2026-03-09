"use client";

import { History, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import {
  createCustomerProjectAction,
  deleteCustomerProjectAction,
  updateCustomerProjectAction,
  updateCustomerProjectBusinessGoalAction,
} from "@/app/(dashboard)/customer-management/actions";
import { CustomerProjectForm } from "@/components/customer/customer-project-form";
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

type ProjectRow = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  name: string;
  productLine: string | null;
  targetDimension: unknown;
  targetDescription: string | null;
  businessStage: string | null;
  businessGoalAchieved: string | null;
  businessGoalUpdatedAt: Date | string | null;
  businessGoalEvidence: string | null;
  businessGoalHistories?: Array<{
    id: string;
    businessGoalAchieved: string;
    businessGoalUpdatedAt: Date | string;
    businessGoalEvidence: string;
    createdAt: Date | string;
  }>;
  note: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
};

function toDimensionText(value: unknown) {
  if (!Array.isArray(value)) return "-";
  const rows = value.filter((item) => typeof item === "string") as string[];
  return rows.length ? rows.join("、") : "-";
}

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

export function CustomerProjectTable({
  rows,
  customerOptions,
  role,
  managerName,
  canEdit,
}: {
  rows: ProjectRow[];
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
                新增项目
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl" data-no-drag-scroll="true">
              <DialogHeader>
                <DialogTitle>新增项目清单（突破/续费/复购）</DialogTitle>
                <DialogDescription>用于新建客户成功计划时关联“经营目标-扩大收入”主数据。</DialogDescription>
              </DialogHeader>
              <CustomerProjectForm
                mode="create"
                role={role}
                managerName={managerName}
                customerOptions={customerOptions}
                submitLabel="保存项目"
                action={createCustomerProjectAction}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : null}

      <DragScrollContainer showHint>
        <table className="w-full min-w-[1220px] text-[13px] leading-5">
          <thead className="bg-muted/40">
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-center [&>th]:align-middle [&>th]:font-semibold [&>th:last-child]:border-r-0">
              <th>客户名称</th>
              <th>项目名称</th>
              <th>产品线</th>
              <th>目标维度</th>
              <th>业务阶段</th>
              <th>经营目标是否达成</th>
              <th>目标描述</th>
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
                  <td className="text-left">{row.productLine || "-"}</td>
                  <td>{toDimensionText(row.targetDimension)}</td>
                  <td>{row.businessStage || "-"}</td>
                  <td>
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-2">
                        <span>{row.businessGoalAchieved || "-"}</span>
                        {canEdit ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button type="button" variant="ghost" size="icon" data-no-drag-scroll="true" aria-label="更新经营目标是否达成">
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg" data-no-drag-scroll="true">
                              <DialogHeader>
                                <DialogTitle>更新经营目标是否达成</DialogTitle>
                                <DialogDescription>更新后将全局生效，并同步展示到客户成功计划详情。</DialogDescription>
                              </DialogHeader>
                              <form action={updateCustomerProjectBusinessGoalAction} className="space-y-3">
                                <input type="hidden" name="id" value={row.id} />
                                <input type="hidden" name="role" value={role} />
                                <input type="hidden" name="managerName" value={managerName || ""} />
                                <div className="space-y-2">
                                  <Label htmlFor={`business-goal-achieved-${row.id}`}>经营目标是否达成</Label>
                                  <select
                                    id={`business-goal-achieved-${row.id}`}
                                    name="businessGoalAchieved"
                                    defaultValue={row.businessGoalAchieved || "未达成"}
                                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                                    required
                                  >
                                    <option value="复购已下单">复购已下单</option>
                                    <option value="复购机会已立项">复购机会已立项</option>
                                    <option value="续费已达成">续费已达成</option>
                                    <option value="突破业务价值已兑现">突破业务价值已兑现</option>
                                    <option value="未达成">未达成</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`business-goal-updated-at-${row.id}`}>达成更新时间</Label>
                                  <Input
                                    id={`business-goal-updated-at-${row.id}`}
                                    name="businessGoalUpdatedAt"
                                    type="datetime-local"
                                    defaultValue={toDateTimeLocalValue(row.businessGoalUpdatedAt)}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`business-goal-evidence-${row.id}`}>更新举证</Label>
                                  <Textarea
                                    id={`business-goal-evidence-${row.id}`}
                                    name="businessGoalEvidence"
                                    rows={3}
                                    defaultValue={row.businessGoalEvidence || ""}
                                    required
                                  />
                                </div>
                                <div className="rounded-md border bg-muted/20 p-3">
                                  <p className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                    <History className="h-3.5 w-3.5" />
                                    历史记录
                                  </p>
                                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {(row.businessGoalHistories || []).length ? (
                                      (row.businessGoalHistories || []).map((history) => (
                                        <div key={history.id} className="rounded border bg-background px-2 py-1.5 text-xs">
                                          <p>
                                            结果：{history.businessGoalAchieved} ｜ 时间：{formatDateTimeCST(history.businessGoalUpdatedAt)}
                                          </p>
                                          <p className="text-muted-foreground">举证：{history.businessGoalEvidence}</p>
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
                        更新时间：{row.businessGoalUpdatedAt ? formatDateTimeCST(row.businessGoalUpdatedAt) : "-"}
                      </p>
                    </div>
                  </td>
                  <td className="max-w-[260px] whitespace-pre-wrap break-words text-left align-top">{row.targetDescription || "-"}</td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.note || "-"}</td>
                  {canEdit ? (
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button type="button" variant="ghost" size="icon" aria-label="编辑项目" data-no-drag-scroll="true">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl" data-no-drag-scroll="true">
                            <DialogHeader>
                              <DialogTitle>编辑项目清单（突破/续费/复购）</DialogTitle>
                              <DialogDescription>更新后可在新建客户成功计划中直接关联。</DialogDescription>
                            </DialogHeader>
                            <CustomerProjectForm
                              mode="edit"
                              role={role}
                              managerName={managerName}
                              customerOptions={customerOptions}
                              submitLabel="保存修改"
                              action={updateCustomerProjectAction}
                              defaultValues={{
                                id: row.id,
                                customerId: row.customerId,
                                name: row.name,
                                productLine: row.productLine,
                                targetDimension: Array.isArray(row.targetDimension) ? (row.targetDimension as string[]) : [],
                                targetDescription: row.targetDescription,
                                businessStage: row.businessStage,
                                businessGoalAchieved: row.businessGoalAchieved,
                                note: row.note,
                              }}
                            />
                          </DialogContent>
                        </Dialog>
                        <form action={deleteCustomerProjectAction} data-no-drag-scroll="true" className="flex justify-center">
                          <input type="hidden" name="id" value={row.id} />
                          <input type="hidden" name="role" value={role} />
                          <input type="hidden" name="managerName" value={managerName || ""} />
                          <Button type="submit" variant="ghost" size="icon" aria-label="删除项目" data-no-drag-scroll="true">
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
                  暂无项目清单（突破/续费/复购）数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </DragScrollContainer>
    </div>
  );
}
