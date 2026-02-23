import type { KeySuccessScenario } from "@prisma/client";

import { RiskBadge } from "@/components/shared/risk-badge";
import { StageStatusBadge } from "@/components/shared/stage-status-badge";
import { Badge } from "@/components/ui/badge";
import { stageOptions } from "@/lib/constants/domain";

const stageLabelMap = Object.fromEntries(stageOptions.map((item) => [item.value, item.label]));

export function ThreadHeaderSticky({ thread }: { thread: KeySuccessScenario }) {
  return (
    <div className="sticky top-0 z-10 rounded-lg border bg-background/95 p-4 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">{thread.customer}</Badge>
        <Badge variant="outline">{thread.keyProjectScenario}</Badge>
        <Badge variant="outline">Owner: {thread.ownerName}</Badge>
        <Badge variant="outline">阶段: {stageLabelMap[thread.stage] || thread.stage}</Badge>
        <RiskBadge riskLevel={thread.riskLevel} />
        <StageStatusBadge stageStatus={thread.stageStatus} />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        NextAction: {thread.nextAction || "未填写"}
      </p>
    </div>
  );
}
