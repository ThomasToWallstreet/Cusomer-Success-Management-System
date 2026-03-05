"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCustomerScenarioAction,
  deleteCustomerScenarioAction,
  updateCustomerScenarioAction,
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

type ScenarioRow = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  name: string;
  businessNeedAnalysis: string | null;
  personalNeeds: string | null;
  smartGoal: string | null;
  alignedWithCustomer: string | null;
  note: string | null;
};

type CustomerOption = {
  id: string;
  name: string;
};

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
        <table className="w-full min-w-[1200px] text-[13px] leading-5">
          <thead className="bg-muted/40">
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-center [&>th]:align-middle [&>th]:font-semibold [&>th:last-child]:border-r-0">
              <th>客户名称</th>
              <th>场景名称</th>
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
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.businessNeedAnalysis || "-"}</td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.personalNeeds || "-"}</td>
                  <td className="max-w-[220px] whitespace-pre-wrap break-words text-left align-top">{row.smartGoal || "-"}</td>
                  <td>{row.alignedWithCustomer || "-"}</td>
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
                                businessNeedAnalysis: row.businessNeedAnalysis,
                                personalNeeds: row.personalNeeds,
                                smartGoal: row.smartGoal,
                                alignedWithCustomer: row.alignedWithCustomer,
                                note: row.note,
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
                <td colSpan={canEdit ? 8 : 7} className="py-8 text-center text-sm text-muted-foreground">
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

