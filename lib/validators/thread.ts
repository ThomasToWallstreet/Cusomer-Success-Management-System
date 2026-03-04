import { z } from "zod";
import { businessStageValues } from "@/lib/constants/domain";

export const createThreadSchema = z.object({
  role: z.string().optional(),
  managerName: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  keyPerson: z.string().min(1, "关键人必填"),
  keyPersonDept: z.string().optional(),
  keyProjectScenario: z.string().min(1, "关键项目场景必填"),
  productLine: z.string().optional(),
  ownerName: z.string().min(1, "负责人必填"),
}).refine((data) => Boolean((data.customerId && data.customerId.trim()) || (data.customerName && data.customerName.trim())), {
  message: "客户必填（选择已有客户或输入新客户名称）",
  path: ["customerName"],
});

export const createThreadWorkflowSchema = z.object({
  role: z.string().optional(),
  managerName: z.string().optional(),
  customerId: z.string().min(1, "请选择客户"),
  projectItemId: z.string().min(1, "请选择项目清单"),
  contactIds: z.array(z.string().min(1)).min(1, "请至少选择一个关键人"),
  scenarioItemId: z.string().min(1, "请选择场景清单"),
});

export const updateThreadMetaSchema = z.object({
  id: z.string().min(1),
  stage: z.enum([
    "BASIC_INFO",
    "BUSINESS_GOAL",
    "ORG_RELATION",
    "SUCCESS_DEFINITION",
    "KEY_ACTIVITIES",
    "EXECUTION",
  ]),
  stageStatus: z.enum(["IN_PROGRESS", "BLOCKED", "DONE"]),
  riskLevel: z.enum(["GREEN", "YELLOW", "RED"]),
  nextAction: z.string().optional(),
});

export const updateThreadSectionSchema = z.object({
  id: z.string().min(1),
  section: z.enum([
    "goalSection",
    "orgSection",
    "successSection",
    "activitySection",
    "executionSection",
  ]),
  sectionJson: z.string().min(1, "请填写 JSON 内容"),
});

export const updateThreadPlanSchema = z.object({
  id: z.string().min(1),
  keyProjectScenario: z.string().min(1, "项目场景必填"),
  productLine: z.string().optional(),
  keyScenarioDescription: z.string().min(1, "关键场景说明必填"),
  targetDimension: z.array(z.string()).min(1, "目标维度必填"),
  targetDescription: z.string().min(1, "目标描述必填"),
  businessStage: z.enum(businessStageValues),
  businessGoalAchieved: z.string().min(1, "经营目标是否达成必填"),
  orgCurrentState: z.string().min(1, "整体组织关系现状必填"),
  orgChanges: z.string().min(1, "变化情况必填"),
  businessNeedAnalysis: z.string().min(1, "客户业务需求分析必填"),
  personalNeeds: z.string().min(1, "关键人的个人需求必填"),
  smartGoal: z.string().min(1, "客户成功目标（SMART）必填"),
  alignedWithCustomer: z.string().min(1, "是否与客户完成对齐必填"),
});

export const deleteThreadSchema = z.object({
  id: z.string().min(1, "客户成功计划ID缺失"),
  role: z.string().optional(),
  customerId: z.string().optional(),
});
