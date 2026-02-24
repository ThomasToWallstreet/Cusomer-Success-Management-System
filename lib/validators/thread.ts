import { z } from "zod";

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
  projectScenario: z.string().min(1, "项目场景必填"),
  productLine: z.array(
    z.enum([
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
    ]),
  ).min(1, "产品线必填"),
  keyScenarioDescription: z.string().min(1, "关键场景说明必填"),
  targetDimension: z.array(z.enum(["复购", "新业务突破", "续约"])).min(1, "目标维度必填"),
  targetDescription: z.string().min(1, "目标描述必填"),
  businessStage: z.enum([
    "1选择向正确客户销售",
    "2测出效果优势并验证可落地性",
    "3招投标到订单",
    "4帮客户(关键人)快速兑现价值",
    "5持续经营扩大业务合作范围",
  ]),
  businessGoalAchieved: z.enum(["复购已下单", "复购机会已立项", "续费已达成", "突破业务价值已兑现", "未达成"]),
  orgCurrentState: z.enum(["充分信赖", "信任支持", "基本满意", "不够满意", "严重不满"]),
  orgChanges: z.enum(["提升至充分信赖", "提升至信任支持", "下降至严重不满", "下降至不够满意", "无变化", "有非常正向的变化"]),
  stakeholdersJson: z.string().min(2, "关键人条目必填"),
  businessNeedAnalysis: z.string().min(1, "客户业务需求分析必填"),
  personalNeeds: z.string().min(1, "关键人的个人需求必填"),
  smartGoal: z.string().min(1, "客户成功目标必填"),
  alignedWithCustomer: z.enum(["是-充分对齐", "是-部分对齐", "否-未对齐"]),
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
