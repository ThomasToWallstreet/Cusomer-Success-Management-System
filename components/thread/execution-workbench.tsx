import { updateThreadSectionAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
}

export function ExecutionWorkbench({
  threadId,
  activitySection,
  executionSection,
}: {
  threadId: string;
  activitySection: unknown;
  executionSection: unknown;
}) {
  const activity = toRecord(activitySection);
  const execution = toRecord(executionSection);
  const defaultKcpTemplates = JSON.stringify(
    activity.kcpTemplates || [
      {
        kcpType: "ATX_LEFT_SHIFT_PROJECT_CONTROL",
        applicable: true,
        triggerCondition: "",
        standardSteps: [],
        dod: "",
        evidenceRequired: [],
      },
    ],
    null,
    2,
  );
  const defaultExecutionItems = JSON.stringify(
    toArray(execution.executionItems).length
      ? execution.executionItems
      : [
          {
            id: "exec-1",
            type: "GOAL_DERIVED",
            title: "",
            linkedGoal: "",
            owner: "",
            planWeek: "",
            status: "TODO",
            resultSummary: "",
            evidence: "",
            nextAction: "",
          },
        ],
    null,
    2,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">KCP动作维护（动作层）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={updateThreadSectionAction} className="space-y-3">
            <input type="hidden" name="id" value={threadId} />
            <input type="hidden" name="section" value="activitySection" />
            <Textarea name="sectionJson" rows={12} defaultValue={JSON.stringify({ ...activity, kcpTemplates: JSON.parse(defaultKcpTemplates) }, null, 2)} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground">
              建议字段：kcpType/applicable/triggerCondition/standardSteps/dod/evidenceRequired。
            </p>
            <Button size="sm" type="submit">
              保存KCP动作
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">执行动作池（周计划来源）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={updateThreadSectionAction} className="space-y-3">
            <input type="hidden" name="id" value={threadId} />
            <input type="hidden" name="section" value="executionSection" />
            <Textarea
              name="sectionJson"
              rows={12}
              defaultValue={JSON.stringify({ ...execution, executionItems: JSON.parse(defaultExecutionItems) }, null, 2)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              建议字段：id/type/title/linkedGoal/owner/planWeek/status/resultSummary/evidence/nextAction。
            </p>
            <Button size="sm" type="submit">
              保存执行动作池
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
