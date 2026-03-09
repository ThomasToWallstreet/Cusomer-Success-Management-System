import { z } from "zod";

import { businessStageValues } from "@/lib/constants/domain";

const targetDimensionOptions = ["复购", "新业务突破", "续费"] as const;
const productLineOptions = [
  "AC",
  "AF",
  "AD",
  "aDesk",
  "XDR",
  "aES",
  "安全服务",
  "MSS",
  "GPT",
  "HCI",
  "aTrust",
  "SIP",
  "SASE",
  "EDS",
  "AI安全平台",
  "SG",
  "SDDC",
  "CSSP",
  "VPN",
] as const;
const businessGoalResultOptions = [
  "复购已下单",
  "复购机会已立项",
  "续费已达成",
  "突破业务价值已兑现",
  "未达成",
] as const;

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
  name: normalizeRequiredText("项目名称"),
  productLine: z.array(z.enum(productLineOptions)).optional(),
  targetDimension: z.array(z.enum(targetDimensionOptions)).optional(),
  targetDescription: normalizeOptionalText("目标描述", 2000),
  businessStage: z.enum(businessStageValues).optional(),
  businessGoalAchieved: z.enum(businessGoalResultOptions).optional(),
  note: normalizeOptionalText("备注", 2000),
});

export const createCustomerProjectSchema = baseSchema;

export const updateCustomerProjectSchema = baseSchema.extend({
  id: normalizeRequiredText("项目ID"),
});

export const deleteCustomerProjectSchema = z.object({
  id: normalizeRequiredText("项目ID"),
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

export const updateCustomerProjectBusinessGoalSchema = z.object({
  id: normalizeRequiredText("项目ID"),
  businessGoalAchieved: z.enum(businessGoalResultOptions, { message: "经营目标是否达成不合法" }),
  businessGoalUpdatedAt: normalizeRequiredDateTime("达成更新时间"),
  businessGoalEvidence: normalizeRequiredText("更新举证", 1000),
});

export type CreateCustomerProjectInput = z.infer<typeof createCustomerProjectSchema>;
export type UpdateCustomerProjectInput = z.infer<typeof updateCustomerProjectSchema>;
export type UpdateCustomerProjectBusinessGoalInput = z.infer<typeof updateCustomerProjectBusinessGoalSchema>;
