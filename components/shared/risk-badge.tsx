import { Badge } from "@/components/ui/badge";

const riskStyle = {
  GREEN: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  YELLOW: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  RED: "bg-rose-100 text-rose-800 hover:bg-rose-100",
} as const;

const riskLabel = {
  GREEN: "低风险",
  YELLOW: "中风险",
  RED: "高风险",
} as const;

export function RiskBadge({ riskLevel }: { riskLevel: keyof typeof riskStyle }) {
  return <Badge className={riskStyle[riskLevel]}>{riskLabel[riskLevel]}</Badge>;
}
