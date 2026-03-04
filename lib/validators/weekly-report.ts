import { z } from "zod";

export const createWeeklyReportSchema = z
  .object({
    role: z.string().optional(),
    managerName: z.string().optional(),
    customerId: z.string().min(1, "客户必填"),
    ownerName: z.string().min(1, "ownerName 必填"),
    weekStart: z.coerce.date(),
    weekEnd: z.coerce.date(),
    summary: z.string().min(1, "本周总结必填"),
    risks: z.string().optional(),
    nextWeekPlan: z.string().optional(),
    needSupport: z.string().optional(),
    threadIds: z.array(z.string()).default([]),
    weeklyObjectives: z.string().min(1, "请填写本周承接目标"),
    plannedExecutionJson: z.string().min(2, "请填写本周动作清单"),
    executedItemsJson: z.string().min(2, "请填写执行记录"),
    requiredNextActionsJson: z.string().min(2, "请填写下周必要动作"),
    deliveryBreakthroughRiskResult: z.enum(["WORSENING", "NO_CHANGE", "IMPROVING", "SIGNIFICANT_IMPROVING"]),
    deliveryBreakthroughRiskComment: z.string().min(1, "请填写突破落地风险结果说明"),
    keyStakeholderRecognitionResult: z.enum([
      "NOT_YET_RESULT",
      "PENDING_CONFIRMATION",
      "AVERAGE_RESULT",
      "GOOD_RECOGNIZED",
      "BAD_NOT_RECOGNIZED",
      "NOT_APPLICABLE",
    ]),
    keyStakeholderRecognitionComment: z.string().min(1, "请填写关键人认可结果说明"),
    satisfactionRiskLevel: z.enum(["HIGH_RED", "MEDIUM_YELLOW", "LOW_GREEN"]),
    satisfactionRiskReason: z.string().min(1, "请填写满意度风险评估理由"),
  })
  .refine((data) => data.weekStart <= data.weekEnd, {
    message: "周开始日期不能晚于周结束日期",
    path: ["weekStart"],
  });

export const generateWeeklyReportFromExecutionSchema = z
  .object({
    role: z.string().optional(),
    managerName: z.string().optional(),
    customerId: z.string().min(1, "客户必填"),
    ownerName: z.string().min(1, "ownerName 必填"),
    weekStart: z.coerce.date(),
    weekEnd: z.coerce.date(),
    threadIds: z.array(z.string()).min(1, "请至少选择 1 个关键场景"),
  })
  .refine((data) => data.weekStart <= data.weekEnd, {
    message: "周开始日期不能晚于周结束日期",
    path: ["weekStart"],
  });

export const deleteWeeklyReportSchema = z.object({
  id: z.string().min(1, "周报ID缺失"),
  role: z.string().optional(),
  managerName: z.string().optional(),
});

export const updateWeeklyReportSchema = z.object({
  id: z.string().min(1, "周报ID缺失"),
  role: z.string().optional(),
  managerName: z.string().optional(),
  weeklyObjectives: z.string().min(1, "请填写本周承接目标"),
  summary: z.string().min(1, "本周总结必填"),
  risks: z.string().optional(),
  nextWeekPlan: z.string().optional(),
  needSupport: z.string().optional(),
  deliveryBreakthroughRiskResult: z.enum(["WORSENING", "NO_CHANGE", "IMPROVING", "SIGNIFICANT_IMPROVING"]),
  deliveryBreakthroughRiskComment: z.string().min(1, "请填写突破落地风险结果说明"),
  keyStakeholderRecognitionResult: z.enum([
    "NOT_YET_RESULT",
    "PENDING_CONFIRMATION",
    "AVERAGE_RESULT",
    "GOOD_RECOGNIZED",
    "BAD_NOT_RECOGNIZED",
    "NOT_APPLICABLE",
  ]),
  keyStakeholderRecognitionComment: z.string().min(1, "请填写关键人认可结果说明"),
  satisfactionRiskLevel: z.enum(["HIGH_RED", "MEDIUM_YELLOW", "LOW_GREEN"]),
  satisfactionRiskReason: z.string().min(1, "请填写满意度风险评估理由"),
});
