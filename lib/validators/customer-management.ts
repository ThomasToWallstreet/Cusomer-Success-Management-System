import { z } from "zod";

function optionalText(label: string, max = 500) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }
      const normalized = value.trim();
      return normalized.length ? normalized : undefined;
    },
    z.string().max(max, `${label}长度不能超过 ${max} 字符`).optional(),
  );
}

const customerListBaseSchema = z.object({
  customerName: z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z
      .string()
      .min(1, "客户名称不能为空")
      .max(120, "客户名称长度不能超过 120 字符"),
  ),
  groupBranch: optionalText("集团客户重点分支", 2000),
  industry: optionalText("行业", 120),
  customerType: optionalText("客户类型", 120),
  customerStage: optionalText("阶段", 120),
  annualCapacity: optionalText("年产能估算", 120),
  order25: optionalText("25订单", 120),
  performance25: optionalText("25业绩", 120),
  order26: optionalText("26订单", 120),
  performance26: optionalText("26业绩", 120),
  growthOrder: optionalText("增长率-订单", 120),
  growthPerformance: optionalText("增长率-业绩", 120),
  sales: optionalText("销售", 120),
  preSalesSecurity: optionalText("售前（安全）", 120),
  preSalesCloud: optionalText("售前（云）", 120),
  accountServiceManager: optionalText("大客户服务经理", 120),
  remark: optionalText("备注", 2000),
});

export const createCustomerListEntrySchema = customerListBaseSchema;

export const updateCustomerListEntrySchema = customerListBaseSchema.extend({
  id: z.string().trim().min(1, "客户清单 ID 缺失"),
});

export type CreateCustomerListEntryInput = z.infer<typeof createCustomerListEntrySchema>;
export type UpdateCustomerListEntryInput = z.infer<typeof updateCustomerListEntrySchema>;

export const deleteCustomerListRowSchema = z.object({
  id: z.string().trim().min(1, "客户清单 ID 缺失"),
});

export const importCustomerListCsvSchema = z.object({
  file: z.instanceof(File, { message: "请上传 CSV 文件" }),
});
