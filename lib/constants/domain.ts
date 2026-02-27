export const stageOptions = [
  { value: "BASIC_INFO", label: "基本信息" },
  { value: "BUSINESS_GOAL", label: "经营目标" },
  { value: "ORG_RELATION", label: "组织关系" },
  { value: "SUCCESS_DEFINITION", label: "需求与成功目标" },
  { value: "KEY_ACTIVITIES", label: "关键活动" },
  { value: "EXECUTION", label: "执行推进" },
] as const;

export const stageStatusOptions = [
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "BLOCKED", label: "阻塞" },
  { value: "DONE", label: "完成" },
] as const;

export const riskLevelOptions = [
  { value: "GREEN", label: "低风险" },
  { value: "YELLOW", label: "中风险" },
  { value: "RED", label: "高风险" },
] as const;

export const sectionLabels = {
  goalSection: "经营目标",
  orgSection: "组织关系",
  successSection: "需求与成功目标",
  activitySection: "关键活动",
  executionSection: "执行推进",
} as const;

export const executionTypeOptions = [
  { value: "GOAL_DERIVED", label: "G类动作（目标衍生）" },
  { value: "KCP", label: "KCP动作（关键活动）" },
] as const;

export const executionStatusOptions = [
  { value: "TODO", label: "待执行" },
  { value: "IN_PROGRESS", label: "进行中" },
  { value: "DONE", label: "已完成" },
  { value: "BLOCKED", label: "阻塞" },
] as const;

export const kcpActionTypeOptions = [
  { value: "ATX_LEFT_SHIFT_PROJECT_CONTROL", label: "从左边管好项目（ATX流程）" },
  { value: "PROJECT_KICKOFF", label: "项目启动会开展情况" },
  { value: "DELIVERY_STANDARD_AND_VALUE_REALIZATION", label: "交付标准落地与价值兑现情况" },
  { value: "SATISFACTION_RECOVERY", label: "满意度修复" },
  { value: "MOT_TARGET_CONFIRMATION", label: "MOT服务目标确认" },
  { value: "OTHER", label: "其他" },
] as const;

export const deliveryBreakthroughRiskResultOptions = [
  { value: "WORSENING", label: "恶化" },
  { value: "NO_CHANGE", label: "无变化" },
  { value: "IMPROVING", label: "改善" },
  { value: "SIGNIFICANT_IMPROVING", label: "显著改善" },
] as const;

export const keyStakeholderRecognitionResultOptions = [
  { value: "NOT_YET_RESULT", label: "未出结果阶段" },
  { value: "PENDING_CONFIRMATION", label: "效果待确认" },
  { value: "AVERAGE_RESULT", label: "结果一般" },
  { value: "GOOD_RECOGNIZED", label: "结果好-关键人认可" },
  { value: "BAD_NOT_RECOGNIZED", label: "结果不好-关键人不认可" },
  { value: "NOT_APPLICABLE", label: "不涉及" },
] as const;

export const satisfactionRiskLevelOptions = [
  { value: "HIGH_RED", label: "高风险（红色）" },
  { value: "MEDIUM_YELLOW", label: "中风险（黄色）" },
  { value: "LOW_GREEN", label: "低风险（绿色）" },
] as const;

export const businessStageOptions = [
  { value: "1选择向正确客户销售", label: "选择向正确客户销售", order: 1 },
  { value: "2测出效果优势并验证可落地性", label: "测出效果优势并验证可落地性", order: 2 },
  { value: "3招投标到订单", label: "招投标到订单", order: 3 },
  { value: "4帮客户(关键人)快速兑现价值", label: "帮客户(关键人)快速兑现价值", order: 4 },
  { value: "5持续经营扩大业务合作范围", label: "持续经营扩大业务合作范围", order: 5 },
] as const;

export const businessStageValues = businessStageOptions.map((item) => item.value) as [
  (typeof businessStageOptions)[number]["value"],
  ...(typeof businessStageOptions)[number]["value"][],
];
