import Link from "next/link";

import { deleteWeeklyReportAction } from "@/app/(dashboard)/weekly-reports/actions";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateCST, formatDateTimeCST } from "@/lib/datetime";

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

type Props = {
  rows: Row[];
  role?: string;
  managerName?: string;
};

export function WeeklyReportTable({ rows, role, managerName }: Props) {
  const isSupervisor = role === "supervisor";
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
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const canDelete = isSupervisor || (!!managerName && managerName !== "ALL" && row.ownerName === managerName);
            return (
              <TableRow key={row.id}>
                <TableCell>{row.customerName}</TableCell>
                <TableCell>{row.ownerName}</TableCell>
                <TableCell>
                  {formatDateCST(row.weekStart)} ~ {formatDateCST(row.weekEnd)}
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
                  {formatDateTimeCST(row.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  {canDelete ? (
                    <form action={deleteWeeklyReportAction}>
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="role" value={role || ""} />
                      <input type="hidden" name="managerName" value={managerName || ""} />
                      <Button type="submit" variant="outline" size="sm">
                        删除
                      </Button>
                    </form>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      {rows.length === 0 ? <p className="p-4 text-center text-sm text-muted-foreground">暂无周报</p> : null}
    </div>
  );
}
