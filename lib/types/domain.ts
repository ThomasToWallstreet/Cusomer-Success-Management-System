import type { RiskLevel, Stage, StageStatus } from "@prisma/client";

export type ThreadListFilters = {
  customerId?: string;
  customerIds?: string[];
  ownerName?: string;
  stage?: Stage;
  stageStatus?: "IN_PROGRESS" | "BLOCKED" | "DONE";
  riskLevel?: RiskLevel;
  keyword?: string;
};

export type ThreadMetaInput = {
  stage: Stage;
  stageStatus: StageStatus;
  riskLevel: RiskLevel;
  nextAction?: string;
};

export type ExecutionItemType = "GOAL_DERIVED" | "KCP";

export type ExecutionStatus = "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED";

export type SatisfactionRiskLevel = "HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN";

export type KeyStakeholderRecognitionResult =
  | "NOT_YET_RESULT"
  | "PENDING_CONFIRMATION"
  | "AVERAGE_RESULT"
  | "GOOD_RECOGNIZED"
  | "BAD_NOT_RECOGNIZED"
  | "NOT_APPLICABLE";

export type DeliveryBreakthroughRiskResult = "WORSENING" | "NO_CHANGE" | "IMPROVING" | "SIGNIFICANT_IMPROVING";

export type KcpActionType =
  | "ATX_LEFT_SHIFT_PROJECT_CONTROL"
  | "PROJECT_KICKOFF"
  | "DELIVERY_STANDARD_AND_VALUE_REALIZATION"
  | "SATISFACTION_RECOVERY"
  | "MOT_TARGET_CONFIRMATION"
  | "OTHER";

export type ExecutionItemInput = {
  id: string;
  type: ExecutionItemType;
  title: string;
  linkedGoal: string;
  linkedKcpType?: KcpActionType;
  owner: string;
  planWeek?: string;
  status: ExecutionStatus;
  resultSummary?: string;
  evidence?: string;
  targetScore?: number;
  actualScore?: number;
  gap?: number;
  nextAction?: string;
  blockedReason?: string;
};

export type WeeklyQualitativeConclusions = {
  deliveryBreakthroughRiskResult: DeliveryBreakthroughRiskResult;
  deliveryBreakthroughRiskComment: string;
  keyStakeholderRecognitionResult: KeyStakeholderRecognitionResult;
  keyStakeholderRecognitionComment: string;
};
