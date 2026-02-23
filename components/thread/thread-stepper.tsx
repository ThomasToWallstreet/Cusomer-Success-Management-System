import type { RiskLevel, Stage, StageStatus } from "@prisma/client";

import { updateThreadMetaAction } from "@/app/(dashboard)/threads/actions";
import { stageOptions, riskLevelOptions, stageStatusOptions } from "@/lib/constants/domain";
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
    <form action={updateThreadMetaAction} className="space-y-3 rounded-lg border bg-card p-4">
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-3 md:grid-cols-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">阶段</p>
          <Select name="stage" defaultValue={stage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stageOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">阶段状态</p>
          <Select name="stageStatus" defaultValue={stageStatus}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <p className="text-sm font-medium">风险等级</p>
          <Select name="riskLevel" defaultValue={riskLevel}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <p className="text-sm font-medium">NextAction</p>
          <input
            name="nextAction"
            defaultValue={nextAction || ""}
            className="h-9 w-full rounded-md border px-3 text-sm"
          />
        </div>
      </div>
      <Button type="submit">更新关键场景状态</Button>
    </form>
  );
}
