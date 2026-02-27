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

function getStakeholderCurrentStateBadgeClass(value: unknown) {
  const state = typeof value === "string" ? value.trim() : "";
  if (state === "认可") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "一般") return "border-amber-200 bg-amber-50 text-amber-700";
  if (state === "无感知") return "border-slate-200 bg-slate-100 text-slate-700";
  if (state === "不满意") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-slate-200 bg-slate-100 text-slate-600";
}

function getStakeholderCurrentStateText(value: unknown) {
  const state = typeof value === "string" ? value.trim() : "";
  return state || "-";
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
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                  <span>
                    {toText(person.name)} · {toText(person.department)} · {toText(person.level)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${getStakeholderCurrentStateBadgeClass(person.currentState)}`}
                    title={`满意度现状：${getStakeholderCurrentStateText(person.currentState)}`}
                    aria-label={`满意度现状：${getStakeholderCurrentStateText(person.currentState)}`}
                  >
                    满意度现状：{getStakeholderCurrentStateText(person.currentState)}
                  </span>
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
