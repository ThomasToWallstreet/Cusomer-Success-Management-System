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
        risks: true,
        needSupport: true,
      },
      orderBy: { createdAt: "desc" },
      take: 12,
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
  };
}
