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
  { value: "GREEN", label: "绿色" },
  { value: "YELLOW", label: "黄色" },
  { value: "RED", label: "红色" },
] as const;

export const sectionLabels = {
  goalSection: "经营目标",
  orgSection: "组织关系",
  successSection: "需求与成功目标",
  activitySection: "关键活动",
  executionSection: "执行推进",
} as const;
