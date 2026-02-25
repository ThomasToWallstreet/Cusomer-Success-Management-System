import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Row = {
  id: string;
  customerName: string;
  ownerName: string;
  weekStart: Date;
  weekEnd: Date;
  summary: string;
  threadCount: number;
  createdAt: Date;
  satisfactionRiskLevel?: string | null;
  keyStakeholderRecognitionResult?: string | null;
};

const riskLabelMap: Record<string, string> = {
  HIGH_RED: "高风险（红色）",
  MEDIUM_YELLOW: "中风险（黄色）",
  LOW_GREEN: "低风险（绿色）",
};

const recognitionLabelMap: Record<string, string> = {
  NOT_YET_RESULT: "未出结果阶段",
  PENDING_CONFIRMATION: "效果待确认",
  AVERAGE_RESULT: "结果一般",
  GOOD_RECOGNIZED: "结果好-关键人认可",
  BAD_NOT_RECOGNIZED: "结果不好-关键人不认可",
  NOT_APPLICABLE: "不涉及",
};

export function WeeklyReportTable({ rows }: { rows: Row[] }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>客户</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>周区间</TableHead>
            <TableHead>摘要</TableHead>
            <TableHead>关键人认可结果</TableHead>
            <TableHead>满意度风险</TableHead>
            <TableHead>关联关键场景数</TableHead>
            <TableHead>创建时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.customerName}</TableCell>
              <TableCell>{row.ownerName}</TableCell>
              <TableCell>
                {format(row.weekStart, "yyyy-MM-dd", { locale: zhCN })} ~{" "}
                {format(row.weekEnd, "yyyy-MM-dd", { locale: zhCN })}
              </TableCell>
              <TableCell className="max-w-[380px] truncate">
                <Link href={`/weekly-reports/${row.id}`} className="hover:underline">
                  {row.summary}
                </Link>
              </TableCell>
              <TableCell>{recognitionLabelMap[row.keyStakeholderRecognitionResult || ""] || "-"}</TableCell>
              <TableCell>{riskLabelMap[row.satisfactionRiskLevel || ""] || "-"}</TableCell>
              <TableCell>{row.threadCount}</TableCell>
              <TableCell className="text-muted-foreground">
                {format(row.createdAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">暂无周报</p> : null}
    </div>
  );
}
