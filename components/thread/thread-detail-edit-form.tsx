import { updateThreadPlanAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessStageOptions } from "@/lib/constants/domain";

const targetDimensionOptions = ["复购", "新业务突破", "续约"] as const;
const businessGoalResultOptions = ["复购已下单", "复购机会已立项", "续费已达成", "突破业务价值已兑现", "未达成"] as const;
const orgCurrentStateOptions = ["充分信赖", "信任支持", "基本满意", "不够满意", "严重不满"] as const;
const orgChangesOptions = ["提升至充分信赖", "提升至信任支持", "下降至严重不满", "下降至不够满意", "无变化", "有非常正向的变化"] as const;
const alignedWithCustomerOptions = ["是-充分对齐", "是-部分对齐", "否-未对齐"] as const;

type Props = {
  thread: {
    id: string;
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
  return typeof value === "string" ? value : "";
}

function toList(value: unknown) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

export function ThreadDetailEditForm({ thread }: Props) {
  const goal = toRecord(thread.goalSection);
  const org = toRecord(thread.orgSection);
  const success = toRecord(thread.successSection);
  const basic = toRecord(thread.activitySection);
  const targetDimensions = toList(goal.targetDimension);

  return (
    <form action={updateThreadPlanAction} className="space-y-4 rounded-lg border bg-card p-4">
      <input type="hidden" name="id" value={thread.id} />

      <section className="space-y-3 rounded-md border p-3">
        <h3 className="text-sm font-semibold">基础信息</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="keyProjectScenario">项目场景 *</Label>
            <Input id="keyProjectScenario" name="keyProjectScenario" defaultValue={thread.keyProjectScenario} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productLine">产品线</Label>
            <Input id="productLine" name="productLine" defaultValue={thread.productLine || ""} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="keyScenarioDescription">关键场景说明 *</Label>
          <Textarea
            id="keyScenarioDescription"
            name="keyScenarioDescription"
            rows={3}
            defaultValue={toText(basic.keyScenarioDescription)}
            required
          />
        </div>
      </section>

      <section className="space-y-3 rounded-md border p-3">
        <h3 className="text-sm font-semibold">经营目标-扩大收入</h3>
        <div className="space-y-2">
          <Label>目标维度 *</Label>
          <div className="flex flex-wrap gap-3">
            {targetDimensionOptions.map((option) => (
              <label key={option} className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" name="targetDimension" value={option} defaultChecked={targetDimensions.includes(option)} />
                {option}
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="targetDescription">目标描述 *</Label>
          <Textarea id="targetDescription" name="targetDescription" rows={3} defaultValue={toText(goal.targetDescription)} required />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessStage">业务阶段 *</Label>
            <select
              id="businessStage"
              name="businessStage"
              defaultValue={toText(goal.businessStage)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">请选择</option>
              {businessStageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessGoalAchieved">经营目标是否达成 *</Label>
            <select
              id="businessGoalAchieved"
              name="businessGoalAchieved"
              defaultValue={toText(goal.businessGoalAchieved)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">请选择</option>
              {businessGoalResultOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-md border p-3">
        <h3 className="text-sm font-semibold">客户成功目标-组织关系突破</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orgCurrentState">整体组织关系现状 *</Label>
            <select
              id="orgCurrentState"
              name="orgCurrentState"
              defaultValue={toText(org.orgCurrentState)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">请选择</option>
              {orgCurrentStateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgChanges">变化情况 *</Label>
            <select
              id="orgChanges"
              name="orgChanges"
              defaultValue={toText(org.orgChanges)}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              required
            >
              <option value="">请选择</option>
              {orgChangesOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-md border p-3">
        <h3 className="text-sm font-semibold">客户成功目标-需求理解</h3>
        <div className="space-y-2">
          <Label htmlFor="businessNeedAnalysis">客户业务需求分析 *</Label>
          <Textarea
            id="businessNeedAnalysis"
            name="businessNeedAnalysis"
            rows={3}
            defaultValue={toText(success.businessNeedAnalysis)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="personalNeeds">关键人的个人需求 *</Label>
          <Textarea id="personalNeeds" name="personalNeeds" rows={3} defaultValue={toText(success.personalNeeds)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="smartGoal">客户成功目标（SMART） *</Label>
          <Textarea id="smartGoal" name="smartGoal" rows={3} defaultValue={toText(success.smartGoal)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alignedWithCustomer">是否与客户完成对齐 *</Label>
          <select
            id="alignedWithCustomer"
            name="alignedWithCustomer"
            defaultValue={toText(success.alignedWithCustomer)}
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            required
          >
            <option value="">请选择</option>
            {alignedWithCustomerOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit">保存计划内容</Button>
      </div>
    </form>
  );
}
