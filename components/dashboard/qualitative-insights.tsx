import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BlockedItem = {
  id: string;
  customer: string;
  customerRecord?: { id: string; name: string } | null;
  keyProjectScenario: string;
  ownerName: string;
  nextAction: string | null;
};

type Props = {
  blockedRows: BlockedItem[];
  topRisks: string[];
  topSupports: string[];
  customerId?: string;
  managerName?: string;
  role?: string;
};

export function QualitativeInsights({ blockedRows, topRisks, topSupports, customerId, managerName, role }: Props) {
  const threadQuery = new URLSearchParams({
    ...(customerId ? { customerId } : {}),
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
    stageStatus: "BLOCKED",
  }).toString();
  const reportQuery = new URLSearchParams({
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">阻塞关键场景</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/threads?${threadQuery}`}>查看全部</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {blockedRows.map((row) => (
            <div key={row.id} className="rounded border p-2">
              <p className="font-medium">
                {row.customerRecord?.name || row.customer} · {row.keyProjectScenario}
              </p>
              <p className="text-muted-foreground">Owner: {row.ownerName}</p>
              <p className="mt-1 line-clamp-2 text-muted-foreground">{row.nextAction || "暂无 next action"}</p>
            </div>
          ))}
          {blockedRows.length === 0 ? <p className="text-muted-foreground">当前没有阻塞项</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">定性风险摘录</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topRisks.map((item, index) => (
            <p key={`${item}-${index}`} className="rounded border p-2">
              {item}
            </p>
          ))}
          {topRisks.length === 0 ? <p className="text-muted-foreground">暂无风险文本</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">需支持事项摘录</CardTitle>
          <Button size="sm" variant="outline" asChild>
            <Link href={reportQuery ? `/weekly-reports?${reportQuery}` : "/weekly-reports"}>查看周报</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {topSupports.map((item, index) => (
            <p key={`${item}-${index}`} className="rounded border p-2">
              {item}
            </p>
          ))}
          {topSupports.length === 0 ? <p className="text-muted-foreground">暂无需支持事项</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
