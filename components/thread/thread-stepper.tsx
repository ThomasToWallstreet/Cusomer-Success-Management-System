import type { RiskLevel, Stage, StageStatus } from "@prisma/client";

import { updateThreadMetaAction } from "@/app/(dashboard)/threads/actions";
import { riskLevelOptions, stageStatusOptions } from "@/lib/constants/domain";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  id: string;
  stage: Stage;
  stageStatus: StageStatus;
  riskLevel: RiskLevel;
  nextAction?: string | null;
};

export function ThreadStepper({ id, stage, stageStatus, riskLevel, nextAction }: Props) {
  return (
    <form action={updateThreadMetaAction} className="space-y-2 rounded-lg border bg-card p-3">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="stage" value={stage} />
      <input type="hidden" name="nextAction" value={nextAction || ""} />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[170px] flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">阶段状态</p>
          <Select name="stageStatus" defaultValue={stageStatus}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageStatusOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[170px] max-w-[220px] flex-1 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">风险等级</p>
          <Select name="riskLevel" defaultValue={riskLevel}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {riskLevelOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" size="sm" className="cursor-pointer whitespace-nowrap">
          更新关键场景状态
        </Button>
      </div>
    </form>
  );
}
