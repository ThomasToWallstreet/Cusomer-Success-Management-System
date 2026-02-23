import { prisma } from "@/lib/db";

function normalizeManagerName(name: string) {
  return name.trim();
}

export async function listManagerNames() {
  const rows = await prisma.managerCustomerAssignment.findMany({
    distinct: ["managerName"],
    select: { managerName: true },
    orderBy: { managerName: "asc" },
  });
  return rows.map((row) => row.managerName);
}

export async function resolveCurrentManager(input?: string, options?: { allowAll?: boolean }) {
  const managerNames = await listManagerNames();
  if (!managerNames.length) {
    return { managerName: options?.allowAll ? "ALL" : undefined, managerNames };
  }
  const normalized = input?.trim();
  if (options?.allowAll && normalized === "ALL") {
    return { managerName: "ALL", managerNames };
  }
  if (normalized && managerNames.includes(normalized)) {
    return { managerName: normalized, managerNames };
  }
  return { managerName: options?.allowAll ? "ALL" : managerNames[0], managerNames };
}

export async function listAssignments(managerName?: string) {
  return prisma.managerCustomerAssignment.findMany({
    where: managerName ? { managerName } : undefined,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          industry: true,
          tier: true,
        },
      },
    },
    orderBy: [{ managerName: "asc" }, { customer: { name: "asc" } }],
  });
}

export async function upsertAssignment(managerName: string, customerId: string) {
  return prisma.managerCustomerAssignment.upsert({
    where: {
      managerName_customerId: {
        managerName: normalizeManagerName(managerName),
        customerId,
      },
    },
    update: {},
    create: {
      managerName: normalizeManagerName(managerName),
      customerId,
    },
  });
}

export async function deleteAssignment(id: string) {
  return prisma.managerCustomerAssignment.delete({
    where: { id },
  });
}

export async function listCustomerIdsByManager(managerName?: string) {
  if (!managerName) return [];
  const rows = await prisma.managerCustomerAssignment.findMany({
    where: { managerName: normalizeManagerName(managerName) },
    select: { customerId: true },
  });
  return rows.map((row) => row.customerId);
}

export async function exportAssignmentsCsv(managerName?: string) {
  const rows = await listAssignments(managerName);
  const header = "managerName,customerName";
  const body = rows.map((row) => `${escapeCsv(row.managerName)},${escapeCsv(row.customer.name)}`);
  return [header, ...body].join("\n");
}

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

function parseCsvLine(line: string) {
  const output: string[] = [];
  let current = "";
  let quote = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (quote && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        quote = !quote;
      }
      continue;
    }
    if (char === "," && !quote) {
      output.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  output.push(current);
  return output.map((item) => item.trim());
}

export async function importAssignmentsCsv(csvText: string) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { created: 0, skipped: 0, errors: ["CSV 至少包含表头和一条数据"] };
  }

  const [header, ...rows] = lines;
  if (header !== "managerName,customerName") {
    return { created: 0, skipped: 0, errors: ["CSV 表头必须是: managerName,customerName"] };
  }

  const customers = await prisma.customer.findMany({
    select: { id: true, name: true },
  });
  const customerMap = new Map(customers.map((item) => [item.name, item.id]));

  const seen = new Set<string>();
  const errors: string[] = [];
  const prepared: Array<{ managerName: string; customerId: string }> = [];
  let skipped = 0;

  for (let index = 0; index < rows.length; index += 1) {
    const lineNo = index + 2;
    const [managerNameRaw, customerNameRaw] = parseCsvLine(rows[index]);
    const managerName = managerNameRaw?.trim();
    const customerName = customerNameRaw?.trim();

    if (!managerName || !customerName) {
      errors.push(`第 ${lineNo} 行为空值`);
      continue;
    }

    const customerId = customerMap.get(customerName);
    if (!customerId) {
      errors.push(`第 ${lineNo} 行客户不存在: ${customerName}`);
      continue;
    }

    const key = `${managerName}::${customerId}`;
    if (seen.has(key)) {
      skipped += 1;
      continue;
    }
    seen.add(key);
    prepared.push({ managerName, customerId });
  }

  if (errors.length) {
    return { created: 0, skipped: 0, errors };
  }

  let created = 0;
  await prisma.$transaction(async (tx) => {
    for (const row of prepared) {
      const existing = await tx.managerCustomerAssignment.findUnique({
        where: { managerName_customerId: { managerName: row.managerName, customerId: row.customerId } },
        select: { id: true },
      });
      if (existing) {
        skipped += 1;
        continue;
      }
      await tx.managerCustomerAssignment.create({
        data: row,
      });
      created += 1;
    }
  });

  return { created, skipped, errors };
}
