import { z } from "zod";

const alignedWithCustomerOptions = ["是-充分对齐", "是-部分对齐", "否-未对齐"] as const;

function normalizeRequiredText(label: string, max = 120) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z.string().min(1, `${label}不能为空`).max(max, `${label}长度不能超过 ${max} 个字符`),
  );
}

function normalizeOptionalText(label: string, max = 2000) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const normalized = value.trim();
      return normalized.length ? normalized : undefined;
    },
    z.string().max(max, `${label}长度不能超过 ${max} 个字符`).optional(),
  );
}

const baseSchema = z.object({
  customerId: normalizeRequiredText("所属客户"),
  name: normalizeRequiredText("场景名称"),
  keyScenarioDescription: normalizeOptionalText("关键场景说明", 2000),
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

function normalizeRequiredDateTime(label: string) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const raw = value.trim();
      if (!raw) return undefined;
      const matched = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
      if (!matched) return undefined;
      const date = new Date(`${matched[1]}T${matched[2]}:00+08:00`);
      if (Number.isNaN(date.getTime())) return undefined;
      return date;
    },
    z.date({
      invalid_type_error: `${label}格式不正确`,
      required_error: `${label}不能为空`,
    }),
  );
}

export const updateCustomerScenarioAlignmentSchema = z.object({
  id: normalizeRequiredText("场景ID"),
  alignedWithCustomer: z.enum(alignedWithCustomerOptions, { message: "是否与客户完成对齐不合法" }),
  alignedUpdatedAt: normalizeRequiredDateTime("对齐更新时间"),
  alignedEvidence: normalizeRequiredText("更新举证", 1000),
});

export type CreateCustomerScenarioInput = z.infer<typeof createCustomerScenarioSchema>;
export type UpdateCustomerScenarioInput = z.infer<typeof updateCustomerScenarioSchema>;
export type UpdateCustomerScenarioAlignmentInput = z.infer<typeof updateCustomerScenarioAlignmentSchema>;
