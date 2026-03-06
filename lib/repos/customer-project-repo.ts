import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import type {
  CreateCustomerProjectInput,
  UpdateCustomerProjectBusinessGoalInput,
  UpdateCustomerProjectInput,
} from "@/lib/validators/customer-project";

function toNullable(value?: string) {
  return value ?? null;
}

export async function listCustomerProjectItems(scope?: { customerIds?: string[]; customerId?: string; keyword?: string }) {
  const scopedCustomerIds =
    scope?.customerIds !== undefined
      ? scope.customerId
        ? scope.customerIds.filter((id) => id === scope.customerId)
        : scope.customerIds
      : scope?.customerId
        ? [scope.customerId]
        : undefined;

  return prisma.customerProjectItem.findMany({
    where: {
      ...(scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : {}),
      ...(scope?.keyword
        ? {
            OR: [
              { name: { contains: scope.keyword, mode: "insensitive" } },
              { targetDescription: { contains: scope.keyword, mode: "insensitive" } },
              { customer: { name: { contains: scope.keyword, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      businessGoalHistories: {
        orderBy: [{ businessGoalUpdatedAt: "desc" }, { createdAt: "desc" }],
      },
    },
    orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
  });
}

export async function listCustomerProjectItemsByCustomerIds(customerIds: string[]) {
  if (!customerIds.length) return [];
  return prisma.customerProjectItem.findMany({
    where: { customerId: { in: customerIds } },
    orderBy: [{ customerId: "asc" }, { name: "asc" }],
  });
}

export async function getCustomerProjectItemById(id: string) {
  return prisma.customerProjectItem.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function createCustomerProjectItem(input: CreateCustomerProjectInput) {
  return prisma.customerProjectItem.create({
    data: {
      customerId: input.customerId,
      name: input.name,
      productLine: input.productLine && input.productLine.length ? input.productLine.join(",") : null,
      targetDimension: input.targetDimension && input.targetDimension.length ? input.targetDimension : Prisma.DbNull,
      targetDescription: toNullable(input.targetDescription),
      businessStage: toNullable(input.businessStage),
      businessGoalAchieved: toNullable(input.businessGoalAchieved),
      keyScenarioDescription: toNullable(input.keyScenarioDescription),
      note: toNullable(input.note),
    },
  });
}

export async function updateCustomerProjectItem(input: UpdateCustomerProjectInput) {
  return prisma.customerProjectItem.update({
    where: { id: input.id },
    data: {
      customerId: input.customerId,
      name: input.name,
      productLine: input.productLine && input.productLine.length ? input.productLine.join(",") : null,
      targetDimension: input.targetDimension && input.targetDimension.length ? input.targetDimension : Prisma.DbNull,
      targetDescription: toNullable(input.targetDescription),
      businessStage: toNullable(input.businessStage),
      businessGoalAchieved: toNullable(input.businessGoalAchieved),
      keyScenarioDescription: toNullable(input.keyScenarioDescription),
      note: toNullable(input.note),
    },
  });
}

export async function updateCustomerProjectBusinessGoal(input: UpdateCustomerProjectBusinessGoalInput) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.customerProjectItem.update({
      where: { id: input.id },
      data: {
        businessGoalAchieved: input.businessGoalAchieved,
        businessGoalUpdatedAt: input.businessGoalUpdatedAt,
        businessGoalEvidence: input.businessGoalEvidence,
      },
    });
    await tx.customerProjectBusinessGoalHistory.create({
      data: {
        projectItemId: input.id,
        businessGoalAchieved: input.businessGoalAchieved,
        businessGoalUpdatedAt: input.businessGoalUpdatedAt,
        businessGoalEvidence: input.businessGoalEvidence,
      },
    });
    return updated;
  });
}

export async function deleteCustomerProjectItem(id: string) {
  return prisma.customerProjectItem.delete({
    where: { id },
  });
}
