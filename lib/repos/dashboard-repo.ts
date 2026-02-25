import { Stage, StageStatus } from "@prisma/client";

import { prisma } from "@/lib/db";

function collectTopNotes(
  reports: Array<{ risks: string | null; needSupport: string | null }>,
  key: "risks" | "needSupport",
) {
  return reports
    .map((report) => report[key])
    .filter((value): value is string => Boolean(value && value.trim()))
    .flatMap((value) => value.split(/[;；\n]/).map((item) => item.trim()))
    .filter(Boolean)
    .slice(0, 6);
}

const stageOrder: Stage[] = [
  "BASIC_INFO",
  "BUSINESS_GOAL",
  "ORG_RELATION",
  "SUCCESS_DEFINITION",
  "KEY_ACTIVITIES",
  "EXECUTION",
];

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" ? (value as JsonRecord) : {};
}

function asArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? (value as JsonRecord[]) : [];
}

export async function getDashboardSnapshot() {
  return getDashboardSnapshotByCustomer();
}

export async function getDashboardSnapshotByCustomer(customerId?: string, customerIds?: string[]) {
  const scopedCustomerIds =
    customerIds !== undefined
      ? customerId
        ? customerIds.filter((id) => id === customerId)
        : customerIds
      : customerId
        ? [customerId]
        : undefined;
  const whereScope = scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : undefined;

  const [totalCount, statusRows, riskRows, stageRows, blockedRows, recentReports] = await Promise.all([
    prisma.keySuccessScenario.count({
      where: whereScope,
    }),
    prisma.keySuccessScenario.groupBy({
      by: ["stageStatus"],
      where: whereScope,
      _count: { _all: true },
    }),
    prisma.keySuccessScenario.groupBy({
      by: ["riskLevel"],
      where: whereScope,
      _count: { _all: true },
    }),
    prisma.keySuccessScenario.groupBy({
      by: ["stage"],
      where: whereScope,
      _count: { _all: true },
    }),
    prisma.keySuccessScenario.findMany({
      where: {
        stageStatus: StageStatus.BLOCKED,
        ...(whereScope || {}),
      },
      select: {
        id: true,
        customer: true,
        customerRecord: {
          select: { id: true, name: true },
        },
        keyProjectScenario: true,
        ownerName: true,
        nextAction: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.weeklyReport.findMany({
      where: whereScope,
      select: {
        weeklyObjectives: true,
        plannedExecutionItems: true,
        executedItems: true,
        requiredNextActions: true,
        qualitativeConclusions: true,
        satisfactionRiskLevel: true,
        risks: true,
        needSupport: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 24,
    }),
  ]);

  const statusCountMap = statusRows.reduce<Record<StageStatus, number>>(
    (acc, item) => {
      acc[item.stageStatus] = item._count._all;
      return acc;
    },
    {
      IN_PROGRESS: 0,
      BLOCKED: 0,
      DONE: 0,
    },
  );

  const riskCountMap = riskRows.reduce<Record<"GREEN" | "YELLOW" | "RED", number>>(
    (acc, item) => {
      acc[item.riskLevel] = item._count._all;
      return acc;
    },
    {
      GREEN: 0,
      YELLOW: 0,
      RED: 0,
    },
  );

  const stageCountMap = stageRows.reduce<Record<Stage, number>>(
    (acc, item) => {
      acc[item.stage] = item._count._all;
      return acc;
    },
    {
      BASIC_INFO: 0,
      BUSINESS_GOAL: 0,
      ORG_RELATION: 0,
      SUCCESS_DEFINITION: 0,
      KEY_ACTIVITIES: 0,
      EXECUTION: 0,
    },
  );

  const riskLevelCountMap = recentReports.reduce<Record<"HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN", number>>(
    (acc, report) => {
      const level = report.satisfactionRiskLevel as "HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN" | null;
      if (level && acc[level] !== undefined) {
        acc[level] += 1;
      }
      return acc;
    },
    {
      HIGH_RED: 0,
      MEDIUM_YELLOW: 0,
      LOW_GREEN: 0,
    },
  );

  const recognitionCountMap = recentReports.reduce<
    Record<
      "NOT_YET_RESULT" | "PENDING_CONFIRMATION" | "AVERAGE_RESULT" | "GOOD_RECOGNIZED" | "BAD_NOT_RECOGNIZED" | "NOT_APPLICABLE",
      number
    >
  >(
    (acc, report) => {
      const conclusions = asRecord(report.qualitativeConclusions);
      const key = String(conclusions.keyStakeholderRecognitionResult || "") as
        | "NOT_YET_RESULT"
        | "PENDING_CONFIRMATION"
        | "AVERAGE_RESULT"
        | "GOOD_RECOGNIZED"
        | "BAD_NOT_RECOGNIZED"
        | "NOT_APPLICABLE";
      if (acc[key] !== undefined) {
        acc[key] += 1;
      }
      return acc;
    },
    {
      NOT_YET_RESULT: 0,
      PENDING_CONFIRMATION: 0,
      AVERAGE_RESULT: 0,
      GOOD_RECOGNIZED: 0,
      BAD_NOT_RECOGNIZED: 0,
      NOT_APPLICABLE: 0,
    },
  );

  const executionHealth = recentReports.reduce(
    (acc, report) => {
      const planned = asArray(report.plannedExecutionItems);
      const executed = asArray(report.executedItems);
      const required = asArray(report.requiredNextActions);
      acc.plannedTotal += planned.length;
      acc.executedTotal += executed.length;
      acc.requiredTotal += required.length;
      executed.forEach((item) => {
        const status = String(item.status || "");
        if (status === "BLOCKED") {
          acc.blockedTotal += 1;
        }
        const hasEvidence = Boolean(String(item.evidence || "").trim());
        if (hasEvidence) {
          acc.evidenceCompleteTotal += 1;
        }
      });
      if (String(asRecord(report.weeklyObjectives).text || "").trim()) {
        acc.objectiveFilledCount += 1;
      }
      return acc;
    },
    {
      plannedTotal: 0,
      executedTotal: 0,
      blockedTotal: 0,
      evidenceCompleteTotal: 0,
      requiredTotal: 0,
      objectiveFilledCount: 0,
    },
  );

  const executionHealthRates = {
    completionRate:
      executionHealth.plannedTotal > 0
        ? Number((executionHealth.executedTotal / executionHealth.plannedTotal).toFixed(2))
        : 0,
    blockedRate:
      executionHealth.executedTotal > 0
        ? Number((executionHealth.blockedTotal / executionHealth.executedTotal).toFixed(2))
        : 0,
    evidenceIntegrityRate:
      executionHealth.executedTotal > 0
        ? Number((executionHealth.evidenceCompleteTotal / executionHealth.executedTotal).toFixed(2))
        : 0,
    objectiveCarryRate:
      recentReports.length > 0 ? Number((executionHealth.objectiveFilledCount / recentReports.length).toFixed(2)) : 0,
  };

  const highRiskRequiredActions = recentReports
    .filter((report) => report.satisfactionRiskLevel === "HIGH_RED")
    .flatMap((report) => asArray(report.requiredNextActions))
    .slice(0, 10);

  return {
    totalCount,
    statusCountMap,
    riskCountMap,
    stageBreakdown: stageOrder.map((stage) => ({
      stage,
      count: stageCountMap[stage] || 0,
      ratio: totalCount > 0 ? Number(((stageCountMap[stage] || 0) / totalCount).toFixed(2)) : 0,
    })),
    blockedRows,
    selectedCustomerId: customerId || null,
    topRisks: collectTopNotes(recentReports, "risks"),
    topSupports: collectTopNotes(recentReports, "needSupport"),
    riskLevelCountMap,
    recognitionCountMap,
    executionHealth,
    executionHealthRates,
    highRiskRequiredActions,
  };
}
