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
  })
  .refine((data) => data.weekStart <= data.weekEnd, {
    message: "周开始日期不能晚于周结束日期",
    path: ["weekStart"],
  });
