import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { getCustomerGoalProgressSummary } from "@/lib/thread-goal-progress";

type ScenarioLike = {
  goalSection?: unknown;
  orgSection?: unknown;
  successSection?: unknown;
};

type SnapshotRow = {
  customerId: string;
  weekStart: Date;
  revenueRate: number;
  orgRate: number;
  valueRate: number;
  scenarioCount: number;
};

function getWeekStart(date = new Date()) {
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  const day = current.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diff);
  return current;
}

export async function ensureCustomerGoalWeeklySnapshot(
  customerId: string,
  scenarios: ScenarioLike[],
  now = new Date(),
) {
  if (!customerId) return;
  const weekStart = getWeekStart(now);
  const summary = getCustomerGoalProgressSummary(scenarios);

  try {
    await prisma.$executeRaw(
      Prisma.sql`
      INSERT INTO "CustomerGoalWeeklySnapshot"
      ("id", "customerId", "weekStart", "revenueRate", "orgRate", "valueRate", "scenarioCount", "createdAt", "updatedAt")
      VALUES (
        ${crypto.randomUUID()},
        ${customerId},
        ${weekStart},
        ${summary.revenueRate},
        ${summary.orgRate},
        ${summary.valueRate},
        ${summary.sampleSize},
        NOW(),
        NOW()
      )
      ON CONFLICT ("customerId", "weekStart")
      DO UPDATE SET
        "revenueRate" = EXCLUDED."revenueRate",
        "orgRate" = EXCLUDED."orgRate",
        "valueRate" = EXCLUDED."valueRate",
        "scenarioCount" = EXCLUDED."scenarioCount",
        "updatedAt" = NOW()
      `,
    );
  } catch {
    // 避免迁移未执行时影响主页面可用性
  }
}

export async function listLatestGoalSnapshotTrendByCustomerIds(customerIds: string[], weeks = 4) {
  if (!customerIds.length) return {};

  try {
    const idsSql = Prisma.join(customerIds.map((id) => Prisma.sql`${id}`));
    const rows = await prisma.$queryRaw<Array<SnapshotRow & { rn: number }>>(
      Prisma.sql`
      SELECT * FROM (
        SELECT
          "customerId",
          "weekStart",
          "revenueRate",
          "orgRate",
          "valueRate",
          "scenarioCount",
          ROW_NUMBER() OVER (PARTITION BY "customerId" ORDER BY "weekStart" DESC) AS "rn"
        FROM "CustomerGoalWeeklySnapshot"
        WHERE "customerId" IN (${idsSql})
      ) t
      WHERE t."rn" <= ${weeks}
      ORDER BY t."customerId", t."weekStart" ASC
      `,
    );

    const bucket: Record<string, SnapshotRow[]> = {};
    for (const row of rows) {
      if (!bucket[row.customerId]) bucket[row.customerId] = [];
      bucket[row.customerId].push(row);
    }

    return Object.fromEntries(
      Object.entries(bucket).map(([customerId, list]) => {
        const first = list[0];
        const last = list[list.length - 1];
        return [
          customerId,
          {
            revenueDelta: (last?.revenueRate || 0) - (first?.revenueRate || 0),
            orgDelta: (last?.orgRate || 0) - (first?.orgRate || 0),
            valueDelta: (last?.valueRate || 0) - (first?.valueRate || 0),
            weeks: list.length,
            points: list.map((item) => ({
              weekStart: item.weekStart,
              revenueRate: item.revenueRate,
              orgRate: item.orgRate,
              valueRate: item.valueRate,
            })),
          },
        ];
      }),
    ) as Record<
      string,
      {
        revenueDelta: number;
        orgDelta: number;
        valueDelta: number;
        weeks: number;
        points: Array<{
          weekStart: Date;
          revenueRate: number;
          orgRate: number;
          valueRate: number;
        }>;
      }
    >;
  } catch {
    return {};
  }
}
