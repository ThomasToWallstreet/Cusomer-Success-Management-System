import { prisma } from "@/lib/db";
import { countBlockedByOwnerForThreadIds, countRiskByOwnerForThreadIds } from "@/lib/repos/thread-repo";

export async function createWeeklyReport(data: {
  customerId: string;
  ownerName: string;
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  risks?: string;
  nextWeekPlan?: string;
  needSupport?: string;
  threadIds: string[];
}) {
  return prisma.$transaction(async (tx) => {
    if (data.threadIds.length > 0) {
      const matched = await tx.keySuccessScenario.count({
        where: {
          id: { in: data.threadIds },
          customerId: data.customerId,
        },
      });

      if (matched !== data.threadIds.length) {
        throw new Error("周报只能关联同一客户下的关键场景");
      }
    }

    const report = await tx.weeklyReport.create({
      data: {
        customerRecord: {
          connect: { id: data.customerId },
        },
        ownerName: data.ownerName,
        weekStart: data.weekStart,
        weekEnd: data.weekEnd,
        summary: data.summary,
        risks: data.risks || null,
        nextWeekPlan: data.nextWeekPlan || null,
        needSupport: data.needSupport || null,
      },
    });

    if (data.threadIds.length > 0) {
      await tx.weeklyReportThread.createMany({
        data: data.threadIds.map((threadId) => ({
          weeklyReportId: report.id,
          threadId,
        })),
        skipDuplicates: true,
      });
    }

    return report;
  });
}

export async function listWeeklyReports(
  weekStart?: Date,
  weekEnd?: Date,
  customerId?: string,
  customerIds?: string[],
) {
  const scopedCustomerIds =
    customerIds !== undefined
      ? customerId
        ? customerIds.filter((id) => id === customerId)
        : customerIds
      : customerId
        ? [customerId]
        : undefined;

  return prisma.weeklyReport.findMany({
    where: {
      ...(weekStart && weekEnd
        ? {
            weekStart: { gte: weekStart },
            weekEnd: { lte: weekEnd },
          }
        : {}),
      ...(scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : {}),
    },
    orderBy: [{ weekStart: "desc" }, { createdAt: "desc" }],
    include: {
      customerRecord: {
        select: { id: true, name: true },
      },
      threadLinks: {
        include: {
          thread: {
            select: {
              id: true,
              ownerName: true,
              riskLevel: true,
              stageStatus: true,
              customerId: true,
            },
          },
        },
      },
    },
  });
}

export async function getWeeklyReportDetail(id: string) {
  return prisma.weeklyReport.findUnique({
    where: { id },
    include: {
      customerRecord: true,
      threadLinks: {
        include: {
          thread: {
            include: {
              customerRecord: true,
            },
          },
        },
      },
    },
  });
}

export async function buildWeeklyOwnerSummary(
  weekStart?: Date,
  weekEnd?: Date,
  customerId?: string,
  customerIds?: string[],
) {
  const reports = await listWeeklyReports(weekStart, weekEnd, customerId, customerIds);
  const ownerCount: Record<string, number> = {};
  const threadIds = new Set<string>();

  reports.forEach((report) => {
    ownerCount[report.ownerName] = (ownerCount[report.ownerName] || 0) + 1;
    report.threadLinks.forEach((link) => {
      threadIds.add(link.thread.id);
    });
  });

  const idList = [...threadIds];
  const riskByOwner = await countRiskByOwnerForThreadIds(idList);
  const blockedByOwner = await countBlockedByOwnerForThreadIds(idList);

  return Object.keys(ownerCount)
    .sort((a, b) => a.localeCompare(b))
    .map((ownerName) => ({
      ownerName,
      reportCount: ownerCount[ownerName],
      greenCount: riskByOwner[ownerName]?.GREEN || 0,
      yellowCount: riskByOwner[ownerName]?.YELLOW || 0,
      redCount: riskByOwner[ownerName]?.RED || 0,
      blockedCount: blockedByOwner[ownerName] || 0,
    }));
}
