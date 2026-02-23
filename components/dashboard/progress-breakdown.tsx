import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stageOptions } from "@/lib/constants/domain";

const labelMap = Object.fromEntries(stageOptions.map((item) => [item.value, item.label]));

type Item = {
  stage: string;
  count: number;
  ratio: number;
};

export function ProgressBreakdown({
  items,
  customerId,
  managerName,
  role,
}: {
  items: Item[];
  customerId?: string;
  managerName?: string;
  role?: string;
}) {
  const query = new URLSearchParams({
    ...(customerId ? { customerId } : {}),
    ...(managerName ? { managerName } : {}),
    ...(role ? { role } : {}),
  }).toString();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">阶段进展分布</CardTitle>
        <Button size="sm" variant="outline" asChild>
          <Link href={query ? `/threads?${query}` : "/threads"}>查看客户成功计划</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.stage} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <p>{labelMap[item.stage] || item.stage}</p>
              <p className="text-muted-foreground">
                {item.count} / {Math.round(item.ratio * 100)}%
              </p>
            </div>
            <div className="h-2 rounded bg-muted">
              <div
                className="h-2 rounded bg-primary"
                style={{ width: `${Math.min(100, Math.max(0, item.ratio * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
