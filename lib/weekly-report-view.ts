export const weeklyRiskLabelMap: Record<string, string> = {
  HIGH_RED: "高风险（红色）",
  MEDIUM_YELLOW: "中风险（黄色）",
  LOW_GREEN: "低风险（绿色）",
};

export const keyStakeholderLabelMap: Record<string, string> = {
  NOT_YET_RESULT: "未出结果阶段",
  PENDING_CONFIRMATION: "效果待确认",
  AVERAGE_RESULT: "结果一般",
  GOOD_RECOGNIZED: "结果好-关键人认可",
  BAD_NOT_RECOGNIZED: "结果不好-关键人不认可",
  NOT_APPLICABLE: "不涉及",
};

export const deliveryRiskLabelMap: Record<string, string> = {
  WORSENING: "恶化",
  NO_CHANGE: "无变化",
  IMPROVING: "改善",
  SIGNIFICANT_IMPROVING: "显著改善",
};

export const executionStatusLabelMap: Record<string, string> = {
  TODO: "待执行",
  IN_PROGRESS: "进行中",
  DONE: "已完成",
  BLOCKED: "阻塞",
};

export const actionPriorityLabelMap: Record<string, string> = {
  P1: "高优先级",
  P2: "中优先级",
  P3: "低优先级",
};

export function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

export function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseJsonArray(raw: string, fieldName: string) {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${fieldName} 必须是 JSON 数组`);
    }
    return parsed as Array<Record<string, unknown>>;
  } catch {
    throw new Error(`${fieldName} 格式不正确`);
  }
}
