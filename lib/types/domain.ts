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
