type Props = {
  thread: {
    keyProjectScenario: string;
    productLine: string | null;
    goalSection: unknown;
    orgSection: unknown;
    successSection: unknown;
    activitySection: unknown;
  };
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown) {
  return typeof value === "string" ? value : "-";
}

function toList(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] items-start gap-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap break-words text-sm">{value || "-"}</p>
    </div>
  );
}

export function ThreadDetailReadonly({ thread }: Props) {
  const goal = toRecord(thread.goalSection);
  const org = toRecord(thread.orgSection);
  const success = toRecord(thread.successSection);
  const basic = toRecord(thread.activitySection);
  const stakeholders = Array.isArray(org.stakeholders) ? (org.stakeholders as Array<Record<string, unknown>>) : [];

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      <section className="space-y-2 rounded-md border p-3">
        <h3 className="text-sm font-semibold">基础信息</h3>
        <ReadonlyRow label="项目场景" value={thread.keyProjectScenario} />
        <ReadonlyRow label="产品线" value={thread.productLine || "-"} />
        <ReadonlyRow label="关键场景说明" value={toText(basic.keyScenarioDescription)} />
      </section>

      <section className="space-y-2 rounded-md border p-3">
        <h3 className="text-sm font-semibold">经营目标-扩大收入</h3>
        <ReadonlyRow label="目标维度" value={toList(goal.targetDimension).join("、") || "-"} />
        <ReadonlyRow label="目标描述" value={toText(goal.targetDescription)} />
        <ReadonlyRow label="业务阶段" value={toText(goal.businessStage)} />
        <ReadonlyRow label="经营目标是否达成" value={toText(goal.businessGoalAchieved)} />
      </section>

      <section className="space-y-2 rounded-md border p-3">
        <h3 className="text-sm font-semibold">客户成功目标-组织关系突破</h3>
        <ReadonlyRow label="整体组织关系现状" value={toText(org.orgCurrentState)} />
        <ReadonlyRow label="变化情况" value={toText(org.orgChanges)} />
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground">关键人条目</p>
          {stakeholders.length ? (
            stakeholders.map((person, index) => (
              <div key={`stakeholder-${index}`} className="rounded-md border bg-muted/20 p-2">
                <p className="text-sm font-medium">
                  {toText(person.name)} · {toText(person.department)} · {toText(person.level)}
                </p>
                <p className="text-xs text-muted-foreground">{toText(person.description)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂无关键人条目</p>
          )}
        </div>
      </section>

      <section className="space-y-2 rounded-md border p-3">
        <h3 className="text-sm font-semibold">客户成功目标-需求理解</h3>
        <ReadonlyRow label="客户业务需求分析" value={toText(success.businessNeedAnalysis)} />
        <ReadonlyRow label="关键人的个人需求" value={toText(success.personalNeeds)} />
        <ReadonlyRow label="客户成功目标（SMART）" value={toText(success.smartGoal)} />
        <ReadonlyRow label="是否与客户完成对齐" value={toText(success.alignedWithCustomer)} />
      </section>
    </div>
  );
}
