import { z } from "zod";

const alignedWithCustomerOptions = ["是-充分对齐", "是-部分对齐", "否-未对齐"] as const;

function normalizeRequiredText(label: string, max = 120) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z
      .string()
      .min(1, `${label}不能为空`)
      .max(max, `${label}长度不能超过 ${max} 字符`),
  );
}

function normalizeOptionalText(label: string, max = 2000) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const normalized = value.trim();
      return normalized.length ? normalized : undefined;
    },
    z.string().max(max, `${label}长度不能超过 ${max} 字符`).optional(),
  );
}

const baseSchema = z.object({
  customerId: normalizeRequiredText("所属客户"),
  name: normalizeRequiredText("场景名称"),
  businessNeedAnalysis: normalizeOptionalText("客户业务需求分析", 4000),
  personalNeeds: normalizeOptionalText("关键人的个人需求", 4000),
  smartGoal: normalizeOptionalText("客户成功目标（SMART）", 4000),
  alignedWithCustomer: z.enum(alignedWithCustomerOptions).optional(),
  note: normalizeOptionalText("备注", 2000),
});

export const createCustomerScenarioSchema = baseSchema;

export const updateCustomerScenarioSchema = baseSchema.extend({
  id: normalizeRequiredText("场景ID"),
});

export const deleteCustomerScenarioSchema = z.object({
  id: normalizeRequiredText("场景ID"),
});

export type CreateCustomerScenarioInput = z.infer<typeof createCustomerScenarioSchema>;
export type UpdateCustomerScenarioInput = z.infer<typeof updateCustomerScenarioSchema>;
