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
  weeklyObjectives: string;
  plannedExecutionJson: string;
  executedItemsJson: string;
  requiredNextActionsJson: string;
  deliveryBreakthroughRiskResult: "WORSENING" | "NO_CHANGE" | "IMPROVING" | "SIGNIFICANT_IMPROVING";
  deliveryBreakthroughRiskComment: string;
  keyStakeholderRecognitionResult:
    | "NOT_YET_RESULT"
    | "PENDING_CONFIRMATION"
    | "AVERAGE_RESULT"
    | "GOOD_RECOGNIZED"
    | "BAD_NOT_RECOGNIZED"
    | "NOT_APPLICABLE";
  keyStakeholderRecognitionComment: string;
  satisfactionRiskLevel: "HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN";
  satisfactionRiskReason: string;
}) {
  const parseJsonArray = (raw: string, fieldName: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        throw new Error(`${fieldName} 必须是 JSON 数组`);
      }
      return parsed;
    } catch {
      throw new Error(`${fieldName} 格式不正确`);
    }
  };
  const plannedExecutionItems = parseJsonArray(data.plannedExecutionJson, "本周动作清单");
  const executedItems = parseJsonArray(data.executedItemsJson, "执行记录");
  const requiredNextActions = parseJsonArray(data.requiredNextActionsJson, "下周必要动作");
  const autoRequiredNextActions: Array<Record<string, unknown>> = [];
  executedItems.forEach((item) => {
    if (String(item.status || "") === "BLOCKED") {
      autoRequiredNextActions.push({
        title: String(item.title || item.executionItemId || "阻塞项推进"),
        source: "阻塞动作自动生成",
        priority: "P1",
      });
    }
  });

  const inferredRiskLevel =
    data.keyStakeholderRecognitionResult === "BAD_NOT_RECOGNIZED"
      ? "HIGH_RED"
      : data.keyStakeholderRecognitionResult === "GOOD_RECOGNIZED"
        ? "LOW_GREEN"
        : "MEDIUM_YELLOW";
  const effectiveRiskLevel =
    data.keyStakeholderRecognitionResult === "NOT_APPLICABLE" ? data.satisfactionRiskLevel : inferredRiskLevel;
  if (effectiveRiskLevel === "HIGH_RED") {
    autoRequiredNextActions.push({
      title: "高风险客户满意度修复专项推进",
      source: "风险升高自动生成",
      priority: "P1",
    });
  }
  if (data.deliveryBreakthroughRiskResult === "WORSENING") {
    autoRequiredNextActions.push({
      title: "突破落地风险恶化专项校准",
      source: "结论恶化自动生成",
      priority: "P1",
    });
  }
  const mergedRequiredActions = [...requiredNextActions, ...autoRequiredNextActions].filter((item, index, arr) => {
    const title = String(item.title || "").trim();
    if (!title) return false;
    return arr.findIndex((target) => String(target.title || "").trim() === title) === index;
  });

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
        risks: data.risks || data.satisfactionRiskReason || null,
        nextWeekPlan: data.nextWeekPlan || JSON.stringify(mergedRequiredActions, null, 2),
        needSupport: data.needSupport || null,
        weeklyObjectives: {
          text: data.weeklyObjectives,
        },
        plannedExecutionItems,
        executedItems,
        qualitativeConclusions: {
          deliveryBreakthroughRiskResult: data.deliveryBreakthroughRiskResult,
          deliveryBreakthroughRiskComment: data.deliveryBreakthroughRiskComment,
          keyStakeholderRecognitionResult: data.keyStakeholderRecognitionResult,
          keyStakeholderRecognitionComment: data.keyStakeholderRecognitionComment,
        },
        satisfactionRiskLevel: effectiveRiskLevel,
        satisfactionRiskReason: data.satisfactionRiskReason,
        requiredNextActions: mergedRequiredActions,
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
      actionSnapshots: {
        include: {
          action: true,
        },
      },
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

export async function deleteWeeklyReport(id: string) {
  return prisma.weeklyReport.delete({
    where: { id },
  });
}

export async function updateWeeklyReport(
  id: string,
  data: {
    weeklyObjectives: string;
    summary: string;
    risks?: string;
    nextWeekPlan?: string;
    needSupport?: string;
    deliveryBreakthroughRiskResult: "WORSENING" | "NO_CHANGE" | "IMPROVING" | "SIGNIFICANT_IMPROVING";
    deliveryBreakthroughRiskComment: string;
    keyStakeholderRecognitionResult:
      | "NOT_YET_RESULT"
      | "PENDING_CONFIRMATION"
      | "AVERAGE_RESULT"
      | "GOOD_RECOGNIZED"
      | "BAD_NOT_RECOGNIZED"
      | "NOT_APPLICABLE";
    keyStakeholderRecognitionComment: string;
    satisfactionRiskLevel: "HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN";
    satisfactionRiskReason: string;
  },
) {
  return prisma.weeklyReport.update({
    where: { id },
    data: {
      summary: data.summary,
      risks: data.risks || null,
      nextWeekPlan: data.nextWeekPlan || null,
      needSupport: data.needSupport || null,
      weeklyObjectives: {
        text: data.weeklyObjectives,
      },
      qualitativeConclusions: {
        deliveryBreakthroughRiskResult: data.deliveryBreakthroughRiskResult,
        deliveryBreakthroughRiskComment: data.deliveryBreakthroughRiskComment,
        keyStakeholderRecognitionResult: data.keyStakeholderRecognitionResult,
        keyStakeholderRecognitionComment: data.keyStakeholderRecognitionComment,
      },
      satisfactionRiskLevel: data.satisfactionRiskLevel,
      satisfactionRiskReason: data.satisfactionRiskReason,
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
  const ownerRiskCount: Record<string, Record<"HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN", number>> = {};
  const threadIds = new Set<string>();

  reports.forEach((report) => {
    ownerCount[report.ownerName] = (ownerCount[report.ownerName] || 0) + 1;
    if (!ownerRiskCount[report.ownerName]) {
      ownerRiskCount[report.ownerName] = {
        HIGH_RED: 0,
        MEDIUM_YELLOW: 0,
        LOW_GREEN: 0,
      };
    }
    const riskKey = report.satisfactionRiskLevel as "HIGH_RED" | "MEDIUM_YELLOW" | "LOW_GREEN" | null;
    if (riskKey && ownerRiskCount[report.ownerName][riskKey] !== undefined) {
      ownerRiskCount[report.ownerName][riskKey] += 1;
    }
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
      highRiskCount: ownerRiskCount[ownerName]?.HIGH_RED || 0,
      mediumRiskCount: ownerRiskCount[ownerName]?.MEDIUM_YELLOW || 0,
      lowRiskCount: ownerRiskCount[ownerName]?.LOW_GREEN || 0,
      greenCount: riskByOwner[ownerName]?.GREEN || 0,
      yellowCount: riskByOwner[ownerName]?.YELLOW || 0,
      redCount: riskByOwner[ownerName]?.RED || 0,
      blockedCount: blockedByOwner[ownerName] || 0,
    }));
}
