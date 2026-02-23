import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  totalCount: number;
  statusCountMap: Record<"IN_PROGRESS" | "BLOCKED" | "DONE", number>;
  riskCountMap: Record<"GREEN" | "YELLOW" | "RED", number>;
};

export function OverviewCards({ totalCount, statusCountMap, riskCountMap }: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">关键场景总数</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">{totalCount}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">进行中</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{statusCountMap.IN_PROGRESS}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">阻塞</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-rose-600">{statusCountMap.BLOCKED}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">完成</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-emerald-600">{statusCountMap.DONE}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">风险分布</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>绿: {riskCountMap.GREEN}</p>
          <p>黄: {riskCountMap.YELLOW}</p>
          <p>红: {riskCountMap.RED}</p>
        </CardContent>
      </Card>
    </div>
  );
}
