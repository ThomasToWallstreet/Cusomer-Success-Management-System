import { z } from "zod";

function normalizeRequiredText(label: string, max = 120) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.trim() : ""),
    z
      .string()
      .min(1, `${label}不能为空`)
      .max(max, `${label}长度不能超过 ${max} 字符`),
  );
}

function normalizeOptionalText(label: string, max = 500) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") return undefined;
      const normalized = value.trim();
      return normalized.length ? normalized : undefined;
    },
    z.string().max(max, `${label}长度不能超过 ${max} 字符`).optional(),
  );
}

const customerContactBaseSchema = z.object({
  customerId: normalizeRequiredText("客户"),
  name: normalizeRequiredText("关键人姓名"),
  department: normalizeOptionalText("部门"),
  level: normalizeOptionalText("层级"),
  satisfactionCurrent: z.enum(["认可", "一般", "无感知", "不满意"], {
    message: "满意度现状非法",
  }).default("无感知"),
  satisfactionTarget: z.enum(["认可", "一般", "无感知", "不满意"], {
    message: "满意度目标非法",
  }).default("认可"),
  note: normalizeOptionalText("备注", 1000),
});

export const createCustomerContactSchema = customerContactBaseSchema;

export const updateCustomerContactSchema = customerContactBaseSchema.extend({
  id: normalizeRequiredText("关键人ID"),
});

export const deleteCustomerContactSchema = z.object({
  id: normalizeRequiredText("关键人ID"),
});

function normalizeRequiredDateTime(label: string) {
  return z.preprocess((value) => {
    if (typeof value !== "string") return undefined;
    const raw = value.trim();
    if (!raw) return undefined;
    const matched = raw.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/);
    if (!matched) return undefined;
    const date = new Date(`${matched[1]}T${matched[2]}:00+08:00`);
    if (Number.isNaN(date.getTime())) return undefined;
    return date;
  }, z.date({
    invalid_type_error: `${label}格式不正确`,
    required_error: `${label}不能为空`,
  }));
}

export const updateCustomerContactSatisfactionSchema = z.object({
  id: normalizeRequiredText("关键人ID"),
  satisfactionCurrent: z.enum(["认可", "一般", "无感知", "不满意"], {
    message: "满意度现状非法",
  }),
  satisfactionUpdatedAt: normalizeRequiredDateTime("满意度更新时间"),
  satisfactionEvidence: normalizeRequiredText("更新举证", 1000),
});

export type CreateCustomerContactInput = z.infer<typeof createCustomerContactSchema>;
export type UpdateCustomerContactInput = z.infer<typeof updateCustomerContactSchema>;
export type UpdateCustomerContactSatisfactionInput = z.infer<typeof updateCustomerContactSatisfactionSchema>;
