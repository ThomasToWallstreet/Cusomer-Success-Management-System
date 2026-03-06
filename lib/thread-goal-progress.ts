import { businessStageOptions } from "@/lib/constants/domain";

type Tone = "GREEN" | "YELLOW" | "RED" | "NEUTRAL";

type ScenarioLike = {
  goalSection?: unknown;
  orgSection?: unknown;
  successSection?: unknown;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toAligned(value: unknown): string {
  if (value === true) return "是";
  if (value === false) return "否";
  return toText(value);
}

const SATISFACTION_SCORE: Record<string, number> = {
  认可: 3,
  一般: 2,
  无感知: 1,
  不满意: 0,
};

export function deriveOrgChangesFromSatisfactionStates(states: string[]): string {
  const scores = states
    .map((state) => SATISFACTION_SCORE[state] ?? NaN)
    .filter((score) => Number.isFinite(score));
  if (!scores.length) return "-";
  const avg = scores.reduce((sum, item) => sum + item, 0) / scores.length;
  if (avg >= 2.6) return "提升至充分信赖";
  if (avg >= 2.1) return "提升至信任支持";
  if (avg >= 1.4) return "无变化";
  if (avg >= 0.7) return "下降至不够满意";
  return "下降至严重不满";
}

export function getBusinessGoalTone(value: string): Tone {
  if (!value || value === "-") return "NEUTRAL";
  if (["复购已下单", "续费已达成", "突破业务价值已兑现"].includes(value)) return "GREEN";
  if (value === "复购机会已立项") return "YELLOW";
  if (value === "未达成") return "RED";
  return "NEUTRAL";
}

export function getOrgCurrentTone(value: string): Tone {
  if (!value || value === "-") return "NEUTRAL";
  if (["提升至充分信赖", "提升至信任支持", "有非常正向的变化"].includes(value)) return "GREEN";
  if (value === "无变化") return "YELLOW";
  if (["下降至严重不满", "下降至不够满意"].includes(value)) return "RED";
  return "NEUTRAL";
}

export function getAlignedTone(value: string): Tone {
  if (!value || value === "-") return "NEUTRAL";
  if (["是-充分对齐", "是-部分对齐"].includes(value)) return "GREEN";
  if (value === "否-未对齐") return "RED";
  return "NEUTRAL";
}

export function isBusinessGoalDone(value: string): boolean {
  return ["复购已下单", "续费已达成", "突破业务价值已兑现"].includes(value);
}

export function isOrgGoalDone(value: string): boolean {
  return ["提升至充分信赖", "提升至信任支持", "有非常正向的变化"].includes(value);
}

export function isValueGoalDone(value: string): boolean {
  return ["是-充分对齐", "是-部分对齐"].includes(value);
}

export type ScenarioGoalProgress = {
  revenueDone: boolean;
  orgDone: boolean;
  valueDone: boolean;
  doneCount: number;
  totalCount: 3;
  doneRatio: number;
  businessGoalAchieved: string;
  orgChanges: string;
  orgCurrentState: string;
  alignedWithCustomer: string;
};

export function getScenarioGoalProgress(scenario: ScenarioLike): ScenarioGoalProgress {
  const goal = toRecord(scenario.goalSection);
  const org = toRecord(scenario.orgSection);
  const success = toRecord(scenario.successSection);

  const businessGoalAchieved = toText(goal.businessGoalAchieved) || "-";
  const stakeholderStates = Array.isArray(org.stakeholders)
    ? (org.stakeholders as Array<Record<string, unknown>>)
        .map((item) => toText(item.currentState))
        .filter(Boolean)
    : [];
  const snapshotStates = Array.isArray(org.contactMasterSnapshotList)
    ? (org.contactMasterSnapshotList as Array<Record<string, unknown>>)
        .map((item) => toText(item.satisfactionCurrent))
        .filter(Boolean)
    : [];
  const orgChanges = toText(org.orgChanges) || deriveOrgChangesFromSatisfactionStates([...stakeholderStates, ...snapshotStates]);
  const orgCurrentState = toText(org.orgCurrentState) || "-";
  const alignedWithCustomer = toAligned(success.alignedWithCustomer) || "-";

  const revenueDone = isBusinessGoalDone(businessGoalAchieved);
  const orgDone = isOrgGoalDone(orgChanges);
  const valueDone = isValueGoalDone(alignedWithCustomer);
  const doneCount = Number(revenueDone) + Number(orgDone) + Number(valueDone);

  return {
    revenueDone,
    orgDone,
    valueDone,
    doneCount,
    totalCount: 3,
    doneRatio: doneCount / 3,
    businessGoalAchieved,
    orgChanges,
    orgCurrentState,
    alignedWithCustomer,
  };
}

export type CustomerGoalProgressSummary = {
  revenueRate: number;
  orgRate: number;
  valueRate: number;
  overallRate: number;
  sampleSize: number;
};

export function getCustomerGoalProgressSummary(scenarios: ScenarioLike[]): CustomerGoalProgressSummary {
  const sampleSize = scenarios.length;
  if (!sampleSize) {
    return {
      revenueRate: 0,
      orgRate: 0,
      valueRate: 0,
      overallRate: 0,
      sampleSize: 0,
    };
  }

  let revenueDoneCount = 0;
  let orgDoneCount = 0;
  let valueDoneCount = 0;

  for (const scenario of scenarios) {
    const item = getScenarioGoalProgress(scenario);
    if (item.revenueDone) revenueDoneCount += 1;
    if (item.orgDone) orgDoneCount += 1;
    if (item.valueDone) valueDoneCount += 1;
  }

  const revenueRate = revenueDoneCount / sampleSize;
  const orgRate = orgDoneCount / sampleSize;
  const valueRate = valueDoneCount / sampleSize;

  return {
    revenueRate,
    orgRate,
    valueRate,
    overallRate: (revenueRate + orgRate + valueRate) / 3,
    sampleSize,
  };
}

export type BusinessStageProgress = {
  activeStageValue: string;
  activeStageOrder: number;
  completionRatio: number;
  stages: Array<{ value: string; label: string; order: number; reached: boolean }>;
};

export function getScenarioBusinessStageLabel(scenario: ScenarioLike): string {
  const goal = toRecord(scenario.goalSection);
  const stage = toText(goal.businessStage);
  if (!stage) return "未识别";
  const matched = businessStageOptions.find((item) => item.value === stage);
  const label = matched?.label || stage;
  return label.replace(/\(/g, "（").replace(/\)/g, "）");
}

export function getBusinessStageProgress(scenarios: ScenarioLike[]): BusinessStageProgress {
  const counts = new Map<string, number>();
  for (const scenario of scenarios) {
    const goal = toRecord(scenario.goalSection);
    const stage = toText(goal.businessStage);
    if (!stage) continue;
    counts.set(stage, (counts.get(stage) || 0) + 1);
  }

  if (!counts.size) {
    return {
      activeStageValue: "",
      activeStageOrder: 0,
      completionRatio: 0,
      stages: businessStageOptions.map((item) => ({
        ...item,
        reached: false,
      })),
    };
  }

  let active: (typeof businessStageOptions)[number] = businessStageOptions[0];
  let bestCount = -1;

  for (const option of businessStageOptions) {
    const count = counts.get(option.value) || 0;
    if (count > bestCount || (count === bestCount && option.order > active.order)) {
      bestCount = count;
      active = option;
    }
  }

  return {
    activeStageValue: active.value,
    activeStageOrder: active.order,
    completionRatio: active.order / businessStageOptions.length,
    stages: businessStageOptions.map((item) => ({
      ...item,
      reached: item.order <= active.order,
    })),
  };
}
