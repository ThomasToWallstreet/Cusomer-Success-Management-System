import { prisma } from "@/lib/db";
import { listCustomerIdsByManager } from "@/lib/repos/manager-assignment-repo";

export async function listCustomers() {
  return prisma.customer.findMany({
    select: {
      id: true,
      name: true,
      industry: true,
      tier: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function listCustomersByManager(managerName?: string) {
  if (!managerName) {
    return [];
  }
  const customerIds = await listCustomerIdsByManager(managerName);
  if (!customerIds.length) {
    return [];
  }
  return prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: {
      id: true,
      name: true,
      industry: true,
      tier: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerById(id: string) {
  return prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      industry: true,
      tier: true,
    },
  });
}

export async function getOrCreateCustomerByName(name: string) {
  const normalized = name.trim().replace(/\s+/g, " ");
  return prisma.customer.upsert({
    where: { name: normalized },
    update: {},
    create: { name: normalized, tier: "KA" },
    select: { id: true, name: true },
  });
}
