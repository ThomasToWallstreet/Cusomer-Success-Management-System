import { NextResponse } from "next/server";

import { getExecutionQuarterYearMetrics } from "@/lib/repos/execution-action-repo";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = request.headers.get("x-internal-token");
  const expectedToken = process.env.INTERNAL_CRON_TOKEN;
  if (expectedToken && token !== expectedToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const metrics = await getExecutionQuarterYearMetrics();
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  if (format === "summary") {
    return NextResponse.json({
      quarterEventCount: metrics.quarter.eventCount,
      yearEventCount: metrics.year.eventCount,
      overdueActionCount: metrics.overdueActionCount,
      avgCloseHours: metrics.avgCloseHours,
    });
  }
  return NextResponse.json(metrics);
}
