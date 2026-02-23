import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import type { CreateCustomerListEntryInput, UpdateCustomerListEntryInput } from "@/lib/validators/customer-management";

type CustomerListRowInput = {
  customerName: string;
  groupBranch?: string;
  industry?: string;
  customerType?: string;
  customerStage?: string;
  annualCapacity?: string;
  order25?: string;
  performance25?: string;
  order26?: string;
  performance26?: string;
  growthOrder?: string;
  growthPerformance?: string;
  sales?: string;
  preSalesSecurity?: string;
  preSalesCloud?: string;
  accountServiceManager?: string;
  remark?: string;
};

function toNullable(value?: string) {
  return value ?? null;
}

function buildCustomerListEntryData(
  input: CreateCustomerListEntryInput,
  customerId: string,
  sourceBatch: string,
) {
  return {
    customerId,
    customerName: input.customerName,
    groupBranch: toNullable(input.groupBranch),
    industry: toNullable(input.industry),
    customerType: toNullable(input.customerType),
    customerStage: toNullable(input.customerStage),
    annualCapacity: toNullable(input.annualCapacity),
    order25: toNullable(input.order25),
    performance25: toNullable(input.performance25),
    order26: toNullable(input.order26),
    performance26: toNullable(input.performance26),
    growthOrder: toNullable(input.growthOrder),
    growthPerformance: toNullable(input.growthPerformance),
    sales: toNullable(input.sales),
    preSalesSecurity: toNullable(input.preSalesSecurity),
    preSalesCloud: toNullable(input.preSalesCloud),
    accountServiceManager: toNullable(input.accountServiceManager),
    remark: toNullable(input.remark),
    sourceBatch,
    importedAt: new Date(),
  };
}

async function syncManagerAssignment(
  tx: Prisma.TransactionClient,
  customerId: string,
  managerName?: string,
) {
  await tx.managerCustomerAssignment.deleteMany({
    where: { customerId },
  });
  if (managerName) {
    await tx.managerCustomerAssignment.create({
      data: {
        managerName,
        customerId,
      },
    });
  }
}

export function parseCsvRows(csvText: string) {
  const normalized = csvText.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    const next = normalized[i + 1];

    if (ch === "\"") {
      if (inQuotes && next === "\"") {
        field += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") {
        i += 1;
      }
      row.push(field);
      field = "";
      if (row.some((cell) => cell.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.trim().length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function toOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function toRecord(row: string[]): CustomerListRowInput {
  return {
    customerName: (row[0] || "").trim(),
    groupBranch: toOptional(row[1]),
    industry: toOptional(row[2]),
    customerType: toOptional(row[3]),
    customerStage: toOptional(row[4]),
    annualCapacity: toOptional(row[5]),
    order25: toOptional(row[6]),
    performance25: toOptional(row[7]),
    order26: toOptional(row[8]),
    performance26: toOptional(row[9]),
    growthOrder: toOptional(row[10]),
    growthPerformance: toOptional(row[11]),
    sales: toOptional(row[12]),
    preSalesSecurity: toOptional(row[13]),
    preSalesCloud: toOptional(row[14]),
    accountServiceManager: toOptional(row[15]),
    remark: toOptional(row[16]),
  };
}

export async function importCustomerListCsvFullReplace(csvText: string, sourceBatch: string) {
  const rows = parseCsvRows(csvText);
  if (rows.length < 3) {
    return { total: 0, imported: 0, errors: ["CSV 至少需要两行表头和一行数据"] };
  }

  const dataRows = rows.slice(2);
  const errors: string[] = [];
  const normalizedRows: CustomerListRowInput[] = [];

  dataRows.forEach((raw, index) => {
    const lineNo = index + 3;
    const record = toRecord(raw);
    if (!record.customerName) {
      errors.push(`第 ${lineNo} 行客户名称为空`);
      return;
    }
    normalizedRows.push(record);
  });

  if (errors.length > 0) {
    return { total: dataRows.length, imported: 0, errors };
  }

  await prisma.$transaction(async (tx) => {
    await tx.managerCustomerAssignment.deleteMany();
    await tx.customerListEntry.deleteMany();

    for (const item of normalizedRows) {
      const customer = await tx.customer.upsert({
        where: { name: item.customerName },
        update: {
          industry: item.industry || null,
          tier: item.customerType || null,
        },
        create: {
          name: item.customerName,
          industry: item.industry || null,
          tier: item.customerType || null,
        },
        select: { id: true },
      });

      const entryData = {
        customerId: customer.id,
        customerName: item.customerName,
        groupBranch: item.groupBranch || null,
        industry: item.industry || null,
        customerType: item.customerType || null,
        customerStage: item.customerStage || null,
        annualCapacity: item.annualCapacity || null,
        order25: item.order25 || null,
        performance25: item.performance25 || null,
        order26: item.order26 || null,
        performance26: item.performance26 || null,
        growthOrder: item.growthOrder || null,
        growthPerformance: item.growthPerformance || null,
        sales: item.sales || null,
        preSalesSecurity: item.preSalesSecurity || null,
        preSalesCloud: item.preSalesCloud || null,
        accountServiceManager: item.accountServiceManager || null,
        remark: item.remark || null,
        sourceBatch,
        importedAt: new Date(),
      };

      await tx.customerListEntry.upsert({
        where: { customerId: customer.id },
        create: entryData,
        update: entryData,
      });

      if (item.accountServiceManager) {
        await tx.managerCustomerAssignment.upsert({
          where: {
            managerName_customerId: {
              managerName: item.accountServiceManager,
              customerId: customer.id,
            },
          },
          create: {
            managerName: item.accountServiceManager,
            customerId: customer.id,
          },
          update: {},
        });
      }
    }
  });

  return { total: dataRows.length, imported: normalizedRows.length, errors: [] };
}

export async function createCustomerListEntry(input: CreateCustomerListEntryInput) {
  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { name: input.customerName },
      update: {
        industry: input.industry || null,
        tier: input.customerType || null,
      },
      create: {
        name: input.customerName,
        industry: input.industry || null,
        tier: input.customerType || null,
      },
      select: { id: true },
    });

    const existing = await tx.customerListEntry.findUnique({
      where: { customerId: customer.id },
      select: { id: true },
    });
    if (existing) {
      throw new Error("该客户已存在于客户清单，请使用编辑操作");
    }

    const entry = await tx.customerListEntry.create({
      data: buildCustomerListEntryData(input, customer.id, "WEB_MANUAL"),
    });

    await syncManagerAssignment(tx, customer.id, input.accountServiceManager);
    return entry;
  });
}

export async function updateCustomerListEntry(input: UpdateCustomerListEntryInput) {
  return prisma.$transaction(async (tx) => {
    const existingRow = await tx.customerListEntry.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        customerId: true,
      },
    });
    if (!existingRow) {
      throw new Error("客户清单记录不存在或已删除");
    }

    const customer = await tx.customer.upsert({
      where: { name: input.customerName },
      update: {
        industry: input.industry || null,
        tier: input.customerType || null,
      },
      create: {
        name: input.customerName,
        industry: input.industry || null,
        tier: input.customerType || null,
      },
      select: { id: true },
    });

    const conflicted = await tx.customerListEntry.findUnique({
      where: { customerId: customer.id },
      select: { id: true },
    });
    if (conflicted && conflicted.id !== input.id) {
      throw new Error("客户名称已被其他客户清单记录占用");
    }

    const updated = await tx.customerListEntry.update({
      where: { id: input.id },
      data: buildCustomerListEntryData(input, customer.id, "WEB_MANUAL"),
    });

    if (existingRow.customerId !== customer.id) {
      await tx.managerCustomerAssignment.deleteMany({
        where: { customerId: existingRow.customerId },
      });
    }
    await syncManagerAssignment(tx, customer.id, input.accountServiceManager);
    return updated;
  });
}

export async function listCustomerListEntries(scope?: { managerName?: string }) {
  return prisma.customerListEntry.findMany({
    where: scope?.managerName
      ? {
          accountServiceManager: scope.managerName,
        }
      : undefined,
    orderBy: { customerName: "asc" },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

function escapeCsv(value?: string | null) {
  const text = value ?? "";
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

export async function exportCustomerListCsv(scope?: { managerName?: string }) {
  const rows = await listCustomerListEntries(scope);
  const header1 = [
    "客户名称",
    "集团客户重点分支",
    "行业",
    "客户类型",
    "阶段",
    "年产能估算",
    "2025年预计产出",
    "",
    "2026年预期目标",
    "",
    "增长率",
    "",
    "2026年阵型（KA专职人员）",
    "",
    "",
    "",
    "备注",
  ];
  const header2 = [
    "",
    "",
    "",
    "",
    "",
    "",
    "25订单",
    "25业绩",
    "26订单",
    "26业绩",
    "订单",
    "业绩",
    "销售",
    "售前（安全）",
    "售前（云）",
    "大客户服务经理",
    "",
  ];

  const body = rows.map((row) =>
    [
      row.customerName,
      row.groupBranch,
      row.industry,
      row.customerType,
      row.customerStage,
      row.annualCapacity,
      row.order25,
      row.performance25,
      row.order26,
      row.performance26,
      row.growthOrder,
      row.growthPerformance,
      row.sales,
      row.preSalesSecurity,
      row.preSalesCloud,
      row.accountServiceManager,
      row.remark,
    ]
      .map((item) => escapeCsv(item))
      .join(","),
  );

  return [header1.join(","), header2.join(","), ...body].join("\n");
}

export async function deleteCustomerListEntry(id: string) {
  return prisma.$transaction(async (tx) => {
    const row = await tx.customerListEntry.delete({
      where: { id },
      select: { customerId: true, accountServiceManager: true },
    });
    if (row.accountServiceManager) {
      await tx.managerCustomerAssignment.deleteMany({
        where: {
          customerId: row.customerId,
          managerName: row.accountServiceManager,
        },
      });
    }
    return row;
  });
}
