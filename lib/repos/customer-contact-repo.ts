import { prisma } from "@/lib/db";
import type { CreateCustomerContactInput, UpdateCustomerContactInput } from "@/lib/validators/customer-contact";

function toNullable(value?: string) {
  return value ?? null;
}

export async function listCustomerContacts(scope?: { customerIds?: string[]; customerId?: string; keyword?: string }) {
  const scopedCustomerIds =
    scope?.customerIds !== undefined
      ? scope.customerId
        ? scope.customerIds.filter((id) => id === scope.customerId)
        : scope.customerIds
      : scope?.customerId
        ? [scope.customerId]
        : undefined;

  return prisma.customerContact.findMany({
    where: {
      ...(scopedCustomerIds ? { customerId: { in: scopedCustomerIds } } : {}),
      ...(scope?.keyword
        ? {
            OR: [
              { name: { contains: scope.keyword, mode: "insensitive" } },
              { department: { contains: scope.keyword, mode: "insensitive" } },
              { level: { contains: scope.keyword, mode: "insensitive" } },
              { customer: { name: { contains: scope.keyword, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      customer: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ customer: { name: "asc" } }, { name: "asc" }],
  });
}

export async function listCustomerContactsByCustomerIds(customerIds: string[]) {
  if (!customerIds.length) return [];
  return prisma.customerContact.findMany({
    where: { customerId: { in: customerIds } },
    select: {
      id: true,
      customerId: true,
      name: true,
      department: true,
      level: true,
      satisfactionCurrent: true,
      satisfactionTarget: true,
    },
    orderBy: [{ customerId: "asc" }, { name: "asc" }],
  });
}

export async function getCustomerContactById(id: string) {
  return prisma.customerContact.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, name: true },
      },
    },
  });
}

export async function createCustomerContact(input: CreateCustomerContactInput) {
  return prisma.customerContact.create({
    data: {
      customerId: input.customerId,
      name: input.name,
      department: toNullable(input.department),
      level: toNullable(input.level),
      satisfactionCurrent: input.satisfactionCurrent,
      satisfactionTarget: input.satisfactionTarget,
      note: toNullable(input.note),
    },
  });
}

export async function updateCustomerContact(input: UpdateCustomerContactInput) {
  return prisma.customerContact.update({
    where: { id: input.id },
    data: {
      customerId: input.customerId,
      name: input.name,
      department: toNullable(input.department),
      level: toNullable(input.level),
      satisfactionCurrent: input.satisfactionCurrent,
      satisfactionTarget: input.satisfactionTarget,
      note: toNullable(input.note),
    },
  });
}

export async function deleteCustomerContact(id: string) {
  return prisma.customerContact.delete({
    where: { id },
  });
}
