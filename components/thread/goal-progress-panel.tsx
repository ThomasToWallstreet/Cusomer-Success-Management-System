"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const progressToneByIndex = ["bg-emerald-500", "bg-amber-500", "bg-sky-500"] as const;
  return (
    <div className={`flex h-full flex-col rounded-md border ${compact ? "p-2" : "p-3"}`}>
      <div className={`mb-2 flex items-center justify-between ${compact ? "text-xs" : "text-sm"}`}>
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground">样本场景：{sampleSize}</p>
      </div>
      <div className={`grid flex-1 grid-rows-3 ${compact ? "gap-2" : "gap-3"}`}>
        {items.map((item, idx) => {
          const ratio = Math.max(0, Math.min(1, item.ratio));
          const tone = progressToneByIndex[idx] || "bg-primary";
          return (
            <div key={item.label} className="flex h-full flex-col justify-center space-y-1">
              <div className={`flex items-center justify-between ${compact ? "text-xs" : "text-sm"}`}>
                <span>{item.label}</span>
                <span className="text-muted-foreground">{toPercent(ratio)}</span>
              </div>
              <div className="h-2 rounded bg-muted">
                <div className={`h-2 rounded ${tone}`} style={{ width: `${ratio * 100}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <p className={`mt-2 text-muted-foreground ${compact ? "text-[11px]" : "text-xs"}`}>
        完成标准：收入=复购/续费/业务价值兑现；组织关系=有提升变化；需求理解=充分对齐或部分对齐。
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
  const normalized = points.map((item, idx) => ({
    week: `W${idx + 1}`,
    revenue: Math.max(0, Math.min(1, item.revenueRate)) * 100,
    org: Math.max(0, Math.min(1, item.orgRate)) * 100,
    value: Math.max(0, Math.min(1, item.valueRate)) * 100,
  }));

  const latest = normalized[normalized.length - 1];

  return (
    <div className="h-full rounded-md border bg-muted/20 px-3 py-2">
      <div className="mb-2 flex items-center justify-between text-xs">
        <p className="font-medium text-foreground">{title}</p>
        <p className="text-muted-foreground">{normalized.length} 周</p>
      </div>
      <div className="h-[170px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={normalized} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              width={30}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              formatter={(value: number | undefined) => `${Math.round(value || 0)}%`}
              labelFormatter={(label) => `周次：${label}`}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="org" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
            <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          经营目标-扩大收入（{latest ? `${Math.round(latest.revenue)}%` : "-"}）
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          客户成功-组织关系（{latest ? `${Math.round(latest.org)}%` : "-"}）
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-sky-500" />
          客户成功-价值兑现（{latest ? `${Math.round(latest.value)}%` : "-"}）
        </span>
      </div>
    </div>
  );
}
