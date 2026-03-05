"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCustomerProjectAction,
  deleteCustomerProjectAction,
  updateCustomerProjectAction,
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
  keyScenarioDescription: string | null;
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
        <table className="w-full min-w-[1300px] text-[13px] leading-5">
          <thead className="bg-muted/40">
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-center [&>th]:align-middle [&>th]:font-semibold [&>th:last-child]:border-r-0">
              <th>客户名称</th>
              <th>项目名称</th>
              <th>产品线</th>
              <th>目标维度</th>
              <th>业务阶段</th>
              <th>经营目标是否达成</th>
              <th>目标描述</th>
              <th>关键场景说明</th>
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
                  <td>{row.businessGoalAchieved || "-"}</td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.targetDescription || "-"}</td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.keyScenarioDescription || "-"}</td>
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
                                keyScenarioDescription: row.keyScenarioDescription,
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
                <td colSpan={canEdit ? 10 : 9} className="py-8 text-center text-sm text-muted-foreground">
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

