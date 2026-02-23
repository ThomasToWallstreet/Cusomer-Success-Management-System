import { PrismaClient, RiskLevel, Stage, StageStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.customerListEntry.deleteMany();
  await prisma.managerCustomerAssignment.deleteMany();
  await prisma.weeklyReportThread.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.keySuccessScenario.deleteMany();
  await prisma.customer.deleteMany();

  const customers = await prisma.$transaction([
    prisma.customer.create({ data: { name: "腾讯", industry: "互联网", tier: "KA" } }),
    prisma.customer.create({ data: { name: "平安银行", industry: "金融", tier: "KA" } }),
    prisma.customer.create({ data: { name: "招商蛇口", industry: "地产", tier: "KA" } }),
    prisma.customer.create({ data: { name: "华润集团", industry: "综合集团", tier: "KA" } }),
    prisma.customer.create({ data: { name: "比亚迪", industry: "制造", tier: "KA" } }),
  ]);
  const customerIdByName = Object.fromEntries(customers.map((item) => [item.name, item.id]));

  const threads = await prisma.$transaction(
    [
      {
        customer: "腾讯",
        customerRecord: { connect: { id: customerIdByName["腾讯"] } },
        keyPerson: "王敏",
        keyPersonDept: "数字化中心",
        keyProjectScenario: "AIGC客服提效",
        productLine: "智能客服",
        ownerName: "张三",
        stage: Stage.BUSINESS_GOAL,
        stageStatus: StageStatus.IN_PROGRESS,
        riskLevel: RiskLevel.YELLOW,
        nextAction: "确认Q2目标口径",
      },
      {
        customer: "平安银行",
        customerRecord: { connect: { id: customerIdByName["平安银行"] } },
        keyPerson: "刘洋",
        keyPersonDept: "零售银行部",
        keyProjectScenario: "财富顾问智能陪练",
        productLine: "智能语音",
        ownerName: "李四",
        stage: Stage.ORG_RELATION,
        stageStatus: StageStatus.BLOCKED,
        riskLevel: RiskLevel.RED,
        nextAction: "推动IT安全评审排期",
      },
      {
        customer: "招商蛇口",
        customerRecord: { connect: { id: customerIdByName["招商蛇口"] } },
        keyPerson: "陈航",
        keyProjectScenario: "园区数字运营驾驶舱",
        productLine: "BI平台",
        ownerName: "张三",
        stage: Stage.SUCCESS_DEFINITION,
        stageStatus: StageStatus.IN_PROGRESS,
        riskLevel: RiskLevel.GREEN,
        nextAction: "明确验收口径",
      },
      {
        customer: "华润集团",
        customerRecord: { connect: { id: customerIdByName["华润集团"] } },
        keyPerson: "周琳",
        keyProjectScenario: "跨区域经营分析",
        productLine: "数据中台",
        ownerName: "王五",
        stage: Stage.KEY_ACTIVITIES,
        stageStatus: StageStatus.DONE,
        riskLevel: RiskLevel.GREEN,
        nextAction: "组织阶段复盘会",
      },
      {
        customer: "比亚迪",
        customerRecord: { connect: { id: customerIdByName["比亚迪"] } },
        keyPerson: "黄磊",
        keyProjectScenario: "工厂质检智能识别",
        productLine: "视觉AI",
        ownerName: "李四",
        stage: Stage.EXECUTION,
        stageStatus: StageStatus.IN_PROGRESS,
        riskLevel: RiskLevel.YELLOW,
        nextAction: "跟进试点工厂上线",
      },
    ].map((item) => prisma.keySuccessScenario.create({ data: item })),
  );

  const report1 = await prisma.weeklyReport.create({
    data: {
      customerRecord: { connect: { id: customerIdByName["腾讯"] } },
      ownerName: "张三",
      weekStart: new Date("2026-02-16"),
      weekEnd: new Date("2026-02-22"),
      summary: "本周聚焦腾讯与招商蛇口两条线程推进，经营目标定义趋于稳定。",
      risks: "腾讯项目目标口径仍待客户确认。",
      nextWeekPlan: "完成Q2目标签字版本与首轮试运行计划。",
      needSupport: "需要售前团队补充行业案例材料。",
    },
  });

  const report2 = await prisma.weeklyReport.create({
    data: {
      customerRecord: { connect: { id: customerIdByName["平安银行"] } },
      ownerName: "李四",
      weekStart: new Date("2026-02-16"),
      weekEnd: new Date("2026-02-22"),
      summary: "平安银行与比亚迪项目进入关键推进窗口，跨部门协同压力较大。",
      risks: "平安银行安全评审排期延后，影响上线节奏。",
      nextWeekPlan: "推进安全评审、完成比亚迪试点里程碑验收。",
      needSupport: "需要技术负责人参与客户高层周会。",
    },
  });

  await prisma.weeklyReportThread.createMany({
    data: [
      { weeklyReportId: report1.id, threadId: threads[0].id },
      { weeklyReportId: report1.id, threadId: threads[2].id },
      { weeklyReportId: report2.id, threadId: threads[1].id },
      { weeklyReportId: report2.id, threadId: threads[4].id },
    ],
  });

  await prisma.managerCustomerAssignment.createMany({
    data: [
      { managerName: "张三", customerId: customerIdByName["腾讯"] },
      { managerName: "张三", customerId: customerIdByName["招商蛇口"] },
      { managerName: "李四", customerId: customerIdByName["平安银行"] },
      { managerName: "李四", customerId: customerIdByName["比亚迪"] },
      { managerName: "王五", customerId: customerIdByName["华润集团"] },
    ],
    skipDuplicates: true,
  });

  await prisma.customerListEntry.createMany({
    data: [
      {
        customerId: customerIdByName["腾讯"],
        customerName: "腾讯",
        groupBranch: "腾讯科技（深圳）有限公司",
        industry: "互联网",
        customerType: "GKA",
        customerStage: "成长期",
        order25: "1200",
        performance25: "850",
        order26: "1500",
        performance26: "1100",
        growthOrder: "25%",
        growthPerformance: "29%",
        sales: "李明",
        preSalesSecurity: "张强",
        preSalesCloud: "陈林",
        accountServiceManager: "张三",
        sourceBatch: "seed",
      },
      {
        customerId: customerIdByName["平安银行"],
        customerName: "平安银行",
        groupBranch: "平安科技（深圳）有限公司",
        industry: "金融",
        customerType: "LKA",
        customerStage: "成长期",
        order25: "900",
        performance25: "700",
        order26: "1000",
        performance26: "800",
        growthOrder: "11%",
        growthPerformance: "14%",
        sales: "王刚",
        preSalesSecurity: "马瑞",
        preSalesCloud: "蔡晓森",
        accountServiceManager: "李四",
        sourceBatch: "seed",
      },
      {
        customerId: customerIdByName["招商蛇口"],
        customerName: "招商蛇口",
        industry: "地产",
        customerStage: "孵化期",
        order25: "400",
        performance25: "305",
        order26: "700",
        performance26: "700",
        growthOrder: "75%",
        growthPerformance: "130%",
        sales: "谢玉溪",
        preSalesSecurity: "姜凯",
        preSalesCloud: "董俊",
        accountServiceManager: "张三",
        sourceBatch: "seed",
      },
      {
        customerId: customerIdByName["华润集团"],
        customerName: "华润集团",
        industry: "综合集团",
        customerStage: "成长期",
        order25: "906",
        performance25: "750",
        order26: "1400",
        performance26: "1300",
        growthOrder: "55%",
        growthPerformance: "73%",
        sales: "曾智伟",
        preSalesSecurity: "黄新",
        preSalesCloud: "董俊",
        accountServiceManager: "王五",
        sourceBatch: "seed",
      },
      {
        customerId: customerIdByName["比亚迪"],
        customerName: "比亚迪",
        industry: "制造",
        customerType: "GKA",
        customerStage: "成长期",
        order25: "3260",
        performance25: "2356",
        order26: "1600",
        performance26: "1500",
        growthOrder: "-51%",
        growthPerformance: "-36%",
        sales: "刘海洋",
        preSalesSecurity: "姜凯",
        preSalesCloud: "董俊",
        accountServiceManager: "李四",
        sourceBatch: "seed",
      },
    ],
  });
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
