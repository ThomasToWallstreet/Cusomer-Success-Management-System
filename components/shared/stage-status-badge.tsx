import { Badge } from "@/components/ui/badge";

const statusStyle = {
  IN_PROGRESS: "bg-slate-100 text-slate-800 hover:bg-slate-100",
  BLOCKED: "bg-rose-100 text-rose-800 hover:bg-rose-100",
  DONE: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
} as const;

const statusLabel = {
  IN_PROGRESS: "进行中",
  BLOCKED: "阻塞",
  DONE: "完成",
} as const;

export function StageStatusBadge({
  stageStatus,
}: {
  stageStatus: keyof typeof statusStyle;
}) {
  return <Badge className={statusStyle[stageStatus]}>{statusLabel[stageStatus]}</Badge>;
}
