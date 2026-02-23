import Link from "next/link";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Item = {
  id: string;
  ownerName: string;
  weekStart: Date;
  weekEnd: Date;
  summary: string;
};

export function WeeklyReportTimeline({ items }: { items: Item[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>关联周报（最近5条）</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded border p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {format(item.weekStart, "yyyy-MM-dd", { locale: zhCN })} ~{" "}
                {format(item.weekEnd, "yyyy-MM-dd", { locale: zhCN })}
              </p>
              <Link href={`/weekly-reports/${item.id}`} className="text-sm underline">
                查看详情
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Owner: {item.ownerName}</p>
            <p className="mt-2 text-sm">{item.summary}</p>
          </div>
        ))}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">暂无关联周报</p> : null}
      </CardContent>
    </Card>
  );
}
