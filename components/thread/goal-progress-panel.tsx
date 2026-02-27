type RateItem = {
  label: string;
  ratio: number;
};

function toPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export function GoalProgressPanel({
  title = "三大目标汇总完成率",
  items,
  sampleSize,
  compact = false,
}: {
  title?: string;
  items: RateItem[];
  sampleSize: number;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-md border ${compact ? "p-2" : "p-3"}`}>
      <div className={`mb-2 flex items-center justify-between ${compact ? "text-xs" : "text-sm"}`}>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">样本场景：{sampleSize}</p>
      </div>
      <div className="space-y-2">
        {items.map((item) => {
          const ratio = Math.max(0, Math.min(1, item.ratio));
          return (
            <div key={item.label} className="space-y-1">
              <div className={`flex items-center justify-between ${compact ? "text-xs" : "text-sm"}`}>
                <span>{item.label}</span>
                <span className="text-muted-foreground">{toPercent(ratio)}</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div className="h-2 rounded bg-primary" style={{ width: `${ratio * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className={`mt-2 text-muted-foreground ${compact ? "text-[11px]" : "text-xs"}`}>
        完成标准：收入=复购/续费/业务价值兑现；组织关系=变化情况显著提升；需求理解=充分对齐或部分对齐。
      </p>
    </div>
  );
}

export function BusinessStageTrack({
  stages,
  activeStageOrder,
}: {
  stages: Array<{ order: number; label: string; reached: boolean }>;
  activeStageOrder: number;
}) {
  return (
    <div className="rounded-md border p-3">
      <div className="mb-2 flex items-center justify-between text-sm">
        <p className="font-medium">横向业务流阶段</p>
        <p className="text-muted-foreground">
          当前阶段：{activeStageOrder > 0 ? `S${activeStageOrder}` : "未识别"}
        </p>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {stages.map((item) => (
          <div key={item.order} className="space-y-1">
            <div className={`h-2 rounded ${item.reached ? "bg-primary" : "bg-muted"}`} />
            <p className="text-[11px] text-muted-foreground">S{item.order}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-5">
        {stages.find((item) => item.order === activeStageOrder)?.label || "-"}
      </p>
    </div>
  );
}

export function GoalTrendMini({
  title = "近4周趋势",
  points,
}: {
  title?: string;
  points: Array<{
    revenueRate: number;
    orgRate: number;
    valueRate: number;
  }>;
}) {
  const normalized = points.map((item) => ({
    revenue: Math.max(0, Math.min(1, item.revenueRate)),
    org: Math.max(0, Math.min(1, item.orgRate)),
    value: Math.max(0, Math.min(1, item.valueRate)),
  }));

  const latest = normalized[normalized.length - 1];

  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="mb-2 flex items-center justify-between text-xs">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground">{normalized.length} 周</p>
      </div>
      <div className="space-y-2">
        {[
          { key: "revenue", label: "经营目标-扩大收入", tone: "bg-emerald-500" },
          { key: "org", label: "客户成功-组织关系", tone: "bg-amber-500" },
          { key: "value", label: "客户成功-价值兑现", tone: "bg-sky-500" },
        ].map((row) => (
          <div key={row.key} className="grid grid-cols-[136px_minmax(0,1fr)_40px] items-center gap-2">
            <p className="text-[11px] text-muted-foreground">{row.label}</p>
            <div className="flex h-4 items-end gap-1">
              {normalized.map((point, idx) => {
                const ratio = point[row.key as "revenue" | "org" | "value"];
                return (
                  <div key={`${row.key}-${idx}`} className="h-4 flex-1 rounded-sm bg-muted">
                    <div className={`w-full rounded-sm ${row.tone}`} style={{ height: `${Math.max(8, ratio * 100)}%` }} />
                  </div>
                );
              })}
            </div>
            <p className="text-right text-[11px] text-muted-foreground">
              {latest ? `${Math.round(latest[row.key as "revenue" | "org" | "value"] * 100)}%` : "-"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
