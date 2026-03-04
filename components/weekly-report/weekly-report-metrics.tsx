export function WeeklyReportMetrics({
  metrics,
}: {
  metrics: {
    quarter: { eventCount: number; statusChangeCount: number; archivedCount: number };
    year: { eventCount: number; statusChangeCount: number; archivedCount: number };
    overdueActionCount: number;
    avgCloseHours: number;
  };
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">季度执行事件数</p>
        <p className="mt-1 text-2xl font-semibold">{metrics.quarter.eventCount}</p>
        <p className="text-xs text-muted-foreground">状态变化：{metrics.quarter.statusChangeCount}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">年度执行事件数</p>
        <p className="mt-1 text-2xl font-semibold">{metrics.year.eventCount}</p>
        <p className="text-xs text-muted-foreground">状态变化：{metrics.year.statusChangeCount}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">当前逾期动作</p>
        <p className="mt-1 text-2xl font-semibold">{metrics.overdueActionCount}</p>
        <p className="text-xs text-muted-foreground">归档动作（季度）：{metrics.quarter.archivedCount}</p>
      </div>
      <div className="rounded-lg border bg-card p-3">
        <p className="text-xs text-muted-foreground">平均闭环时长（小时）</p>
        <p className="mt-1 text-2xl font-semibold">{metrics.avgCloseHours}</p>
        <p className="text-xs text-muted-foreground">归档动作（年度）：{metrics.year.archivedCount}</p>
      </div>
    </section>
  );
}
