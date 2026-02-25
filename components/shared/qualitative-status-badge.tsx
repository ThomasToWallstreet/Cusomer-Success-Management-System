import { Badge } from "@/components/ui/badge";

type QualitativeTone = "GREEN" | "YELLOW" | "RED" | "NEUTRAL";

const toneStyle: Record<QualitativeTone, string> = {
  GREEN: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  YELLOW: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  RED: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  NEUTRAL: "bg-slate-100 text-slate-800 hover:bg-slate-100",
};

export function QualitativeStatusBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value?: string;
  tone: QualitativeTone;
}) {
  const hasLabel = label.trim().length > 0;
  return (
    <span className={`inline-flex items-center text-xs text-muted-foreground ${hasLabel ? "gap-1" : ""}`}>
      {hasLabel ? <span>{label}</span> : null}
      <Badge className={toneStyle[tone]}>{value?.trim() || "-"}</Badge>
    </span>
  );
}
