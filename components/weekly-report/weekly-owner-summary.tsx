import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Summary = {
  ownerName: string;
  reportCount: number;
  greenCount: number;
  yellowCount: number;
  redCount: number;
  blockedCount: number;
};

export function WeeklyOwnerSummary({ rows }: { rows: Summary[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {rows.map((row) => (
        <Card key={row.ownerName}>
          <CardHeader>
            <CardTitle className="text-base">{row.ownerName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>周报数: {row.reportCount}</p>
            <p>绿色关键场景: {row.greenCount}</p>
            <p>黄色关键场景: {row.yellowCount}</p>
            <p>红色关键场景: {row.redCount}</p>
            <p>阻塞关键场景: {row.blockedCount}</p>
          </CardContent>
        </Card>
      ))}
      {rows.length === 0 ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">当前筛选周暂无汇总数据</CardContent>
        </Card>
      ) : null}
    </div>
  );
}
