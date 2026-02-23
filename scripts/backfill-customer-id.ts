import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeCustomerName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

async function main() {
  const scenarios = await prisma.keySuccessScenario.findMany({
    select: { id: true, customer: true, customerId: true },
  });

  const customerNameSet = new Set(
    scenarios.map((item) => normalizeCustomerName(item.customer)).filter(Boolean),
  );

  const customerMap = new Map<string, string>();
  for (const customerName of customerNameSet) {
    const customer = await prisma.customer.upsert({
      where: { name: customerName },
      update: {},
      create: { name: customerName, tier: "KA" },
      select: { id: true, name: true },
    });
    customerMap.set(customer.name, customer.id);
  }

  let scenarioBackfilled = 0;
  for (const scenario of scenarios) {
    const customerName = normalizeCustomerName(scenario.customer);
    const customerId = customerMap.get(customerName);
    if (!customerId) continue;
    if (scenario.customerId === customerId) continue;

    await prisma.keySuccessScenario.update({
      where: { id: scenario.id },
      data: { customerId },
    });
    scenarioBackfilled += 1;
  }

  const reports = await prisma.weeklyReport.findMany({
    select: { id: true, customerId: true },
  });

  const audit: Array<{ reportId: string; reason: string }> = [];
  let reportBackfilled = 0;

  for (const report of reports) {
    const linkedScenarios = await prisma.weeklyReportThread.findMany({
      where: { weeklyReportId: report.id },
      select: {
        thread: {
          select: {
            customerId: true,
            customer: true,
          },
        },
      },
    });

    const candidateIds = new Set(
      linkedScenarios
        .map((item) => item.thread.customerId)
        .filter((value): value is string => Boolean(value)),
    );

    if (candidateIds.size === 1) {
      const [customerId] = [...candidateIds];
      if (report.customerId !== customerId) {
        await prisma.weeklyReport.update({
          where: { id: report.id },
          data: { customerId },
        });
        reportBackfilled += 1;
      }
      continue;
    }

    if (candidateIds.size === 0) {
      audit.push({ reportId: report.id, reason: "No linked scenario with customerId" });
      continue;
    }

    audit.push({ reportId: report.id, reason: "Cross-customer linked scenarios found" });
  }

  console.log(
    JSON.stringify(
      {
        scenarioTotal: scenarios.length,
        scenarioBackfilled,
        reportTotal: reports.length,
        reportBackfilled,
        auditCount: audit.length,
        audit,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
