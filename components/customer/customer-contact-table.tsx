"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  createCustomerContactAction,
  deleteCustomerContactAction,
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

type ContactRow = {
  id: string;
  customerId: string;
  customer: { id: string; name: string };
  name: string;
  department: string | null;
  level: string | null;
  satisfactionCurrent: string;
  satisfactionTarget: string;
  note: string | null;
  updatedAt: Date;
};

type CustomerOption = {
  id: string;
  name: string;
};

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
                  <td>{row.satisfactionCurrent || "-"}</td>
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
