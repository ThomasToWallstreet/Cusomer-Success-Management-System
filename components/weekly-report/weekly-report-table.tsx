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
