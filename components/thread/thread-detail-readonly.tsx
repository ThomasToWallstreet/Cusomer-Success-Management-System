import Link from "next/link";

type GoalKey = "BUSINESS_GROWTH" | "ORG_BREAKTHROUGH" | "VALUE_REALIZATION";

type Props = {
  thread: {
    id: string;
    customer?: string | null;
    ownerName?: string | null;
    keyPerson?: string | null;
    keyPersonDept?: string | null;
    keyProjectScenario: string;
    productLine: string | null;
    stageStatus?: string | null;
    riskLevel?: string | null;
    nextAction?: string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
    goalSection: unknown;
    orgSection: unknown;
    successSection: unknown;
    activitySection: unknown;
  };
  managerName?: string;
  role?: string;
  hideGoalActionButtons?: boolean;
};

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function toText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "-";
}

function toList(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    hour12: false,
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function buildExecutionLink(params: {
  threadId: string;
  goalKey: GoalKey;
  managerName?: string;
  role?: string;
}) {
  const query = new URLSearchParams({
    tab: "plan",
    panel: "execution",
    goalKey: params.goalKey,
    mode: "addRegional",
    ...(params.managerName ? { managerName: params.managerName } : {}),
    ...(params.role ? { role: params.role } : {}),
  });
  return `/threads/${params.threadId}?${query.toString()}`;
}

function ReadonlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] items-start gap-3">
      <p className="text-xs leading-6 text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap break-words text-sm leading-6">{value || "-"}</p>
    </div>
  );
}

function GoalSectionHeader({
  title,
  href,
  hideAction,
}: {
  title: string;
  href: string;
  hideAction?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-sm font-semibold leading-6">{title}</h3>
      {!hideAction ? (
        <Link
          href={href}
          className="inline-flex h-8 items-center rounded-md border px-2.5 text-xs text-foreground/90 transition-colors hover:bg-muted"
        >
          新增执行动作
        </Link>
      ) : null}
    </div>
  );
}

export function ThreadDetailReadonly({ thread, managerName, role, hideGoalActionButtons = false }: Props) {
  const goal = toRecord(thread.goalSection);
  const org = toRecord(thread.orgSection);
  const success = toRecord(thread.successSection);
  const basic = toRecord(thread.activitySection);
  const stakeholders = Array.isArray(org.stakeholders) ? (org.stakeholders as Array<Record<string, unknown>>) : [];

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      <section className="space-y-2.5 rounded-md border p-3.5">
        <h3 className="text-sm font-semibold leading-6">基础信息</h3>
        <ReadonlyRow label="客户名称" value={thread.customer || "-"} />
        <ReadonlyRow label="负责人" value={thread.ownerName || "-"} />
        <ReadonlyRow label="关键人" value={thread.keyPerson || "-"} />
        <ReadonlyRow label="关键人部门" value={thread.keyPersonDept || "-"} />
        <ReadonlyRow label="关键场景" value={thread.keyProjectScenario} />
        <ReadonlyRow label="产品线" value={thread.productLine || toText(basic.productLine)} />
        <ReadonlyRow label="关键场景说明" value={toText(basic.keyScenarioDescription)} />
        <ReadonlyRow label="场景状态" value={thread.stageStatus || "-"} />
        <ReadonlyRow label="风险等级" value={thread.riskLevel || "-"} />
        <ReadonlyRow label="下一步动作" value={thread.nextAction || "-"} />
        <ReadonlyRow label="创建时间" value={formatDateTime(thread.createdAt)} />
        <ReadonlyRow label="更新时间" value={formatDateTime(thread.updatedAt)} />
      </section>

      <section className="space-y-2.5 rounded-md border p-3.5">
        <GoalSectionHeader
          title="经营目标-扩大收入"
          hideAction={hideGoalActionButtons}
          href={buildExecutionLink({
            threadId: thread.id,
            goalKey: "BUSINESS_GROWTH",
            managerName,
            role,
          })}
        />
        <ReadonlyRow label="目标维度" value={toList(goal.targetDimension).join("、") || "-"} />
        <ReadonlyRow label="目标描述" value={toText(goal.targetDescription)} />
        <ReadonlyRow label="业务阶段" value={toText(goal.businessStage)} />
        <ReadonlyRow label="经营目标是否达成" value={toText(goal.businessGoalAchieved)} />
      </section>

      <section className="space-y-2.5 rounded-md border p-3.5">
        <GoalSectionHeader
          title="客户成功-组织关系"
          hideAction={hideGoalActionButtons}
          href={buildExecutionLink({
            threadId: thread.id,
            goalKey: "ORG_BREAKTHROUGH",
            managerName,
            role,
          })}
        />
        <ReadonlyRow label="整体组织关系现状" value={toText(org.orgCurrentState)} />
        <ReadonlyRow label="变化情况" value={toText(org.orgChanges)} />
        <div className="space-y-2 pt-1">
          <p className="text-xs text-muted-foreground">关键人条目</p>
          {stakeholders.length ? (
            stakeholders.map((person, index) => (
              <div key={`stakeholder-${index}`} className="rounded-md border bg-muted/20 p-2">
                <p className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
                  <span>
                    {toText(person.name)} / {toText(person.department)} / {toText(person.level)}
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

      <section className="space-y-2.5 rounded-md border p-3.5">
        <GoalSectionHeader
          title="客户成功-价值兑现"
          hideAction={hideGoalActionButtons}
          href={buildExecutionLink({
            threadId: thread.id,
            goalKey: "VALUE_REALIZATION",
            managerName,
            role,
          })}
        />
        <ReadonlyRow label="客户业务需求分析" value={toText(success.businessNeedAnalysis)} />
        <ReadonlyRow label="关键人的个人需求" value={toText(success.personalNeeds)} />
        <ReadonlyRow label="客户成功目标（SMART）" value={toText(success.smartGoal)} />
        <ReadonlyRow label="是否与客户完成对齐" value={toText(success.alignedWithCustomer)} />
      </section>
    </div>
  );
}
