import { prisma } from "@/lib/db";
import type {
  CreateCustomerScenarioInput,
  UpdateCustomerScenarioAlignmentInput,
  UpdateCustomerScenarioInput,
} from "@/lib/validators/customer-scenario";

function toNullable(value?: string) {
  return value ?? null;
}

export async function listCustomerScenarioItems(scope?: { customerIds?: string[]; customerId?: string; keyword?: string }) {
  const scopedCustomerIds =
    scope?.customerIds !== undefined
      ? scope.customerId
        ? scope.customerIds.filter((id) => id === scope.customerId)
        : scope.customerIds
      : scope?.customerId
        ? [scope.customerId]
        : undefined;

  return prisma.customerScenarioItem.findMany({
    where: {
      ...(scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : {}),
      ...(scope?.keyword
        ? {
            OR: [
              { name: { contains: scope.keyword, mode: "insensitive" } },
              { keyScenarioDescription: { contains: scope.keyword, mode: "insensitive" } },
              { businessNeedAnalysis: { contains: scope.keyword, mode: "insensitive" } },
              { customer: { name: { contains: scope.keyword, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      alignmentHistories: {
        orderBy: [{ alignedUpdatedAt: "desc" }, { createdAt: "desc" }],
      },
      attachments: {
        orderBy: [{ createdAt: "desc" }],
      },
    },
    orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
  });
}

export async function listCustomerScenarioItemsByCustomerIds(customerIds: string[]) {
  if (!customerIds.length) return [];
  return prisma.customerScenarioItem.findMany({
    where: { customerId: { in: customerIds } },
    include: {
      attachments: {
        orderBy: [{ createdAt: "desc" }],
      },
    },
    orderBy: [{ customerId: "asc" }, { name: "asc" }],
  });
}

export async function getCustomerScenarioItemById(id: string) {
  return prisma.customerScenarioItem.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true },
      },
      attachments: {
        orderBy: [{ createdAt: "desc" }],
      },
    },
  });
}

export async function createCustomerScenarioItem(input: CreateCustomerScenarioInput) {
  return prisma.customerScenarioItem.create({
    data: {
      customerId: input.customerId,
      name: input.name,
      keyScenarioDescription: toNullable(input.keyScenarioDescription),
      businessNeedAnalysis: toNullable(input.businessNeedAnalysis),
      personalNeeds: toNullable(input.personalNeeds),
      smartGoal: toNullable(input.smartGoal),
      alignedWithCustomer: toNullable(input.alignedWithCustomer),
      note: toNullable(input.note),
    },
  });
}

export async function updateCustomerScenarioItem(input: UpdateCustomerScenarioInput) {
  return prisma.customerScenarioItem.update({
    where: { id: input.id },
    data: {
      customerId: input.customerId,
      name: input.name,
      keyScenarioDescription: toNullable(input.keyScenarioDescription),
      businessNeedAnalysis: toNullable(input.businessNeedAnalysis),
      personalNeeds: toNullable(input.personalNeeds),
      smartGoal: toNullable(input.smartGoal),
      alignedWithCustomer: toNullable(input.alignedWithCustomer),
      note: toNullable(input.note),
    },
  });
}

export async function updateCustomerScenarioAlignment(input: UpdateCustomerScenarioAlignmentInput) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.customerScenarioItem.update({
      where: { id: input.id },
      data: {
        alignedWithCustomer: input.alignedWithCustomer,
        alignedUpdatedAt: input.alignedUpdatedAt,
        alignedEvidence: input.alignedEvidence,
      },
    });
    await tx.customerScenarioAlignmentHistory.create({
      data: {
        scenarioItemId: input.id,
        alignedWithCustomer: input.alignedWithCustomer,
        alignedUpdatedAt: input.alignedUpdatedAt,
        alignedEvidence: input.alignedEvidence,
      },
    });
    return updated;
  });
}

export async function deleteCustomerScenarioItem(id: string) {
  return prisma.customerScenarioItem.delete({
    where: { id },
  });
}
