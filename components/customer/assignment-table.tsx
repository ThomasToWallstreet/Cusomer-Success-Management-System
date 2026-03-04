"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCustomerListEntryAction,
  deleteAssignmentAction,
  updateCustomerListEntryAction,
} from "@/app/(dashboard)/customer-management/actions";
import { CustomerListForm } from "@/components/customer/customer-list-form";
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

type CustomerListRow = {
  id: string;
  customerName: string;
  groupBranch: string | null;
  industry: string | null;
  customerType: string | null;
  customerStage: string | null;
  annualCapacity: string | null;
  order25: string | null;
  performance25: string | null;
  order26: string | null;
  performance26: string | null;
  growthOrder: string | null;
  growthPerformance: string | null;
  sales: string | null;
  preSalesSecurity: string | null;
  preSalesCloud: string | null;
  accountServiceManager: string | null;
  remark: string | null;
};

export function AssignmentTable({
  rows,
  canEdit,
  role,
}: {
  rows: CustomerListRow[];
  canEdit: boolean;
  role: "supervisor" | "manager";
}) {
  if (!rows.length) {
    return <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">暂无客户清单数据。</p>;
  }

  return (
    <div className="space-y-3 overflow-hidden rounded-lg border bg-card p-3">
      {canEdit ? (
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                新增客户清单
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl" data-no-drag-scroll="true">
              <DialogHeader>
                <DialogTitle>新增客户清单</DialogTitle>
                <DialogDescription>可直接在网页端维护客户清单全字段。</DialogDescription>
              </DialogHeader>
              <CustomerListForm
                mode="create"
                role={role}
                submitLabel="保存新增"
                action={createCustomerListEntryAction}
              />
            </DialogContent>
          </Dialog>
        </div>
      ) : null}
      <DragScrollContainer showHint>
        <table className="w-full min-w-[1780px] text-[13px] leading-5">
          <thead className="bg-muted/40">
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2.5 [&>th]:text-center [&>th]:align-middle [&>th]:font-semibold [&>th:last-child]:border-r-0">
              <th rowSpan={2}>客户名称</th>
              <th rowSpan={2}>集团客户重点分支</th>
              <th rowSpan={2}>行业</th>
              <th rowSpan={2}>客户类型</th>
              <th rowSpan={2}>阶段</th>
              <th rowSpan={2}>年产能估算</th>
              <th colSpan={2}>2025年预计产出</th>
              <th colSpan={2}>2026年预期目标</th>
              <th colSpan={2}>增长率</th>
              <th colSpan={4}>2026年阵型（KA专职人员）</th>
              <th rowSpan={2}>备注</th>
              {canEdit ? <th rowSpan={2}>操作</th> : null}
            </tr>
            <tr className="[&>th]:border-b [&>th]:border-r [&>th]:border-border/70 [&>th]:px-2 [&>th]:py-2 [&>th]:text-center [&>th]:align-middle [&>th]:font-medium [&>th:last-child]:border-r-0">
              <th>25订单</th>
              <th>25业绩</th>
              <th>26订单</th>
              <th>26业绩</th>
              <th>订单</th>
              <th>业绩</th>
              <th>销售</th>
              <th>售前（安全）</th>
              <th>售前（云）</th>
              <th>大客户服务经理</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/60 transition-colors hover:bg-muted/30 [&>td]:border-r [&>td]:border-border/50 [&>td]:px-2 [&>td]:py-2.5 [&>td]:text-center [&>td]:align-middle [&>td:last-child]:border-r-0"
              >
                <td className="font-medium">{row.customerName}</td>
                <td title={row.groupBranch || "-"} className="max-w-[260px] whitespace-pre-wrap break-words text-left align-top">
                  {row.groupBranch || "-"}
                </td>
                <td>{row.industry || "-"}</td>
                <td>{row.customerType || "-"}</td>
                <td>{row.customerStage || "-"}</td>
                <td>{row.annualCapacity || "-"}</td>
                <td>{row.order25 || "-"}</td>
                <td>{row.performance25 || "-"}</td>
                <td>{row.order26 || "-"}</td>
                <td>{row.performance26 || "-"}</td>
                <td>{row.growthOrder || "-"}</td>
                <td>{row.growthPerformance || "-"}</td>
                <td>{row.sales || "-"}</td>
                <td>{row.preSalesSecurity || "-"}</td>
                <td>{row.preSalesCloud || "-"}</td>
                <td>{row.accountServiceManager || "-"}</td>
                <td title={row.remark || "-"} className="max-w-[260px] whitespace-pre-wrap break-words text-left align-top">
                  {row.remark || "-"}
                </td>
                {canEdit ? (
                  <td>
                    <div className="flex items-center justify-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="编辑客户清单"
                            data-no-drag-scroll="true"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-4xl" data-no-drag-scroll="true">
                          <DialogHeader>
                            <DialogTitle>编辑客户清单</DialogTitle>
                            <DialogDescription>修改后将同步更新客户归属与经理映射。</DialogDescription>
                          </DialogHeader>
                          <CustomerListForm
                            mode="edit"
                            role={role}
                            submitLabel="保存修改"
                            action={updateCustomerListEntryAction}
                            defaultValues={row}
                          />
                        </DialogContent>
                      </Dialog>
                      <form action={deleteAssignmentAction} data-no-drag-scroll="true" className="flex justify-center">
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="role" value={role} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="icon"
                          aria-label="删除客户清单"
                          data-no-drag-scroll="true"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </form>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </DragScrollContainer>
    </div>
  );
}
