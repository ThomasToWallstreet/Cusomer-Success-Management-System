import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { RiskBadge } from "@/components/shared/risk-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { stageOptions } from "@/lib/constants/domain";

type ThreadRow = {
  id: string;
  customer: string;
  customerRecord?: { name: string } | null;
  keyPerson: string;
  keyProjectScenario: string;
  productLine: string | null;
  ownerName: string;
  stage: string;
  riskLevel: "GREEN" | "YELLOW" | "RED";
  nextAction: string | null;
  updatedAt: Date;
};

const stageLabelMap = Object.fromEntries(stageOptions.map((item) => [item.value, item.label]));

export function ThreadTable({ rows }: { rows: ThreadRow[] }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>客户</TableHead>
            <TableHead>关键人</TableHead>
            <TableHead>关键项目场景</TableHead>
            <TableHead>产品线</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>阶段</TableHead>
            <TableHead>风险</TableHead>
            <TableHead>NextAction</TableHead>
            <TableHead>更新时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <Link href={`/threads/${item.id}`} className="font-medium hover:underline">
                  {item.customerRecord?.name || item.customer}
                </Link>
              </TableCell>
              <TableCell>{item.keyPerson}</TableCell>
              <TableCell className="max-w-[280px] truncate">{item.keyProjectScenario}</TableCell>
              <TableCell>{item.productLine || "-"}</TableCell>
              <TableCell>{item.ownerName}</TableCell>
              <TableCell>{stageLabelMap[item.stage] || item.stage}</TableCell>
              <TableCell>
                <RiskBadge riskLevel={item.riskLevel} />
              </TableCell>
              <TableCell className="max-w-[240px] truncate text-muted-foreground">
                {item.nextAction || "-"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(item.updatedAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">暂无符合条件的关键场景</div>
      ) : null}
    </div>
  );
}
