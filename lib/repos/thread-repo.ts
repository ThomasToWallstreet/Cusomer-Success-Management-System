import { Prisma, type RiskLevel, type Stage } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { ThreadListFilters, ThreadMetaInput } from "@/lib/types/domain";

export async function listOwners(customerId?: string, customerIds?: string[]) {
  const scopedCustomerIds =
    customerIds !== undefined
      ? customerId
        ? customerIds.filter((id) => id === customerId)
        : customerIds
      : customerId
        ? [customerId]
        : undefined;
  const rows = await prisma.keySuccessScenario.findMany({
    where: scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : undefined,
    distinct: ["ownerName"],
    select: { ownerName: true },
    orderBy: { ownerName: "asc" },
  });
  return rows.map((row) => row.ownerName);
}

export async function listThreads(filters: ThreadListFilters = {}) {
  const scopedCustomerIds =
    filters.customerIds !== undefined
      ? filters.customerId
        ? filters.customerIds.filter((id) => id === filters.customerId)
        : filters.customerIds
      : filters.customerId
        ? [filters.customerId]
        : undefined;
  const where: Prisma.KeySuccessScenarioWhereInput = {
    ...(scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : {}),
    ...(filters.ownerName ? { ownerName: filters.ownerName } : {}),
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.stageStatus ? { stageStatus: filters.stageStatus } : {}),
    ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
  };

  if (filters.keyword) {
    where.OR = [
      { customer: { contains: filters.keyword, mode: "insensitive" } },
      { customerRecord: { name: { contains: filters.keyword, mode: "insensitive" } } },
      { keyPerson: { contains: filters.keyword, mode: "insensitive" } },
      { keyProjectScenario: { contains: filters.keyword, mode: "insensitive" } },
      { nextAction: { contains: filters.keyword, mode: "insensitive" } },
    ];
  }

  return prisma.keySuccessScenario.findMany({
    where,
    include: {
      customerRecord: {
        select: { id: true, name: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function countThreadsUpdatedInLastDays(filters: ThreadListFilters = {}, days = 7) {
  const scopedCustomerIds =
    filters.customerIds !== undefined
      ? filters.customerId
        ? filters.customerIds.filter((id) => id === filters.customerId)
        : filters.customerIds
      : filters.customerId
        ? [filters.customerId]
        : undefined;
  const where: Prisma.KeySuccessScenarioWhereInput = {
    ...(scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : {}),
    ...(filters.ownerName ? { ownerName: filters.ownerName } : {}),
    ...(filters.stage ? { stage: filters.stage } : {}),
    ...(filters.stageStatus ? { stageStatus: filters.stageStatus } : {}),
    ...(filters.riskLevel ? { riskLevel: filters.riskLevel } : {}),
    updatedAt: {
      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
    },
  };

  if (filters.keyword) {
    where.OR = [
      { customer: { contains: filters.keyword, mode: "insensitive" } },
      { customerRecord: { name: { contains: filters.keyword, mode: "insensitive" } } },
      { keyPerson: { contains: filters.keyword, mode: "insensitive" } },
      { keyProjectScenario: { contains: filters.keyword, mode: "insensitive" } },
      { nextAction: { contains: filters.keyword, mode: "insensitive" } },
    ];
  }

  return prisma.keySuccessScenario.count({ where });
}

export async function listThreadsByCustomer(customerId?: string, ownerName?: string) {
  return prisma.keySuccessScenario.findMany({
    where: {
      ...(customerId ? { customerId } : {}),
      ...(ownerName ? { ownerName } : {}),
    },
    orderBy: [{ ownerName: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      ownerName: true,
      customer: true,
      customerId: true,
      keyProjectScenario: true,
      riskLevel: true,
      stageStatus: true,
      executionSection: true,
    },
  });
}

export async function listThreadsByCustomerIds(customerIds: string[], ownerName?: string) {
  if (!customerIds.length) return [];
  return prisma.keySuccessScenario.findMany({
    where: {
      customerId: { in: customerIds },
      ...(ownerName ? { ownerName } : {}),
    },
    orderBy: [{ ownerName: "asc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      ownerName: true,
      customer: true,
      customerId: true,
      keyProjectScenario: true,
      riskLevel: true,
      stageStatus: true,
      executionSection: true,
    },
  });
}

export async function createThread(data: Prisma.KeySuccessScenarioCreateInput) {
  return prisma.keySuccessScenario.create({ data });
}

export async function deleteThread(id: string) {
  return prisma.keySuccessScenario.delete({
    where: { id },
  });
}

export async function getThreadDetail(id: string) {
  return prisma.keySuccessScenario.findUnique({
    where: { id },
    include: {
      customerRecord: true,
      weeklyReportLinks: {
        include: {
          weeklyReport: {
            include: {
              customerRecord: true,
            },
          },
        },
        orderBy: {
          weeklyReport: {
            weekStart: "desc",
          },
        },
        take: 5,
      },
    },
  });
}

export async function updateThreadMeta(id: string, input: ThreadMetaInput) {
  return prisma.keySuccessScenario.update({
    where: { id },
    data: {
      stage: input.stage,
      stageStatus: input.stageStatus,
      riskLevel: input.riskLevel,
      nextAction: input.nextAction || null,
    },
  });
}

export async function updateThreadSection(
  id: string,
  section: "goalSection" | "orgSection" | "successSection" | "activitySection" | "executionSection",
  value: Prisma.InputJsonValue,
) {
  return prisma.keySuccessScenario.update({
    where: { id },
    data: {
      [section]: value,
    },
  });
}

export async function updateThreadOverview(
  id: string,
  input: {
    keyProjectScenario: string;
    productLine?: string | null;
  },
) {
  return prisma.keySuccessScenario.update({
    where: { id },
    data: {
      keyProjectScenario: input.keyProjectScenario,
      productLine: input.productLine || null,
    },
  });
}

export async function countRiskByOwnerForThreadIds(threadIds: string[]) {
  const rows = await prisma.keySuccessScenario.groupBy({
    by: ["ownerName", "riskLevel"],
    where: { id: { in: threadIds } },
    _count: { _all: true },
  });

  return rows.reduce<Record<string, Record<RiskLevel, number>>>((acc, row) => {
    if (!acc[row.ownerName]) {
      acc[row.ownerName] = {
        GREEN: 0,
        YELLOW: 0,
        RED: 0,
      };
    }
    acc[row.ownerName][row.riskLevel] = row._count._all;
    return acc;
  }, {});
}

export async function countBlockedByOwnerForThreadIds(threadIds: string[]) {
  const rows = await prisma.keySuccessScenario.groupBy({
    by: ["ownerName"],
    where: {
      id: { in: threadIds },
      stageStatus: "BLOCKED",
    },
    _count: { _all: true },
  });

  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.ownerName] = row._count._all;
    return acc;
  }, {});
}

export async function listDistinctCustomers(customerIds?: string[]) {
  return prisma.customer.findMany({
    where: customerIds ? { id: { in: customerIds } } : undefined,
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function listDistinctStages() {
  const rows = await prisma.keySuccessScenario.findMany({
    distinct: ["stage"],
    select: { stage: true },
  });
  return rows.map((row) => row.stage as Stage);
}
