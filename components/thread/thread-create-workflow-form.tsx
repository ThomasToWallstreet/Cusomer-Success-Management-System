"use client";

import { useMemo, useState } from "react";

import { createThreadWorkflowAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type StakeholderRow = {
  name: string;
  department: string;
  level: string;
  description: string;
  currentState: string;
  target: string;
  acceptanceCriteria: string;
  changeAnalysis: string;
};

const emptyStakeholder = (): StakeholderRow => ({
  name: "",
  department: "",
  level: "",
  description: "",
  currentState: "",
  target: "",
  acceptanceCriteria: "",
  changeAnalysis: "",
});

type ModuleKey =
  | "manage-customer"
  | "basic-info"
  | "business-goal"
  | "org-breakthrough"
  | "needs-understanding";

const flowSteps: Array<{ key: Exclude<ModuleKey, "basic-info">; label: string }> = [
  { key: "manage-customer", label: "管理客户" },
  { key: "business-goal", label: "经营目标-扩大收入" },
  { key: "org-breakthrough", label: "客户成功目标-组织关系突破" },
  { key: "needs-understanding", label: "客户成功目标-需求理解" },
];

export function ThreadCreateWorkflowForm({
  customerOptions,
  ownerOptions,
  selectedCustomerId,
  managerName,
  role,
}: {
  customerOptions: Array<{ id: string; name: string }>;
  ownerOptions: string[];
  selectedCustomerId?: string;
  managerName?: string;
  role?: string;
}) {
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([emptyStakeholder()]);
  const [activeModule, setActiveModule] = useState<ModuleKey>("manage-customer");
  const stakeholdersJson = useMemo(() => JSON.stringify(stakeholders), [stakeholders]);
  const activeFlowIndex = flowSteps.findIndex((step) => step.key === activeModule);

  const sectionClass = (module: ModuleKey) =>
    `space-y-3 rounded-md border p-4 transition-colors ${activeModule === module ? "border-primary bg-primary/5" : "bg-background"}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>新增客户成功计划</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          action={createThreadWorkflowAction}
          className="space-y-5"
          onFocusCapture={(event) => {
            const target = event.target as HTMLElement | null;
            const module = target?.closest("[data-module]")?.getAttribute("data-module") as ModuleKey | null;
            if (module) {
              setActiveModule(module);
            }
          }}
        >
          <input type="hidden" name="managerName" value={managerName || ""} />
          <input type="hidden" name="role" value={role || ""} />
          <input type="hidden" name="stakeholdersJson" value={stakeholdersJson} />

          <div className="rounded-md border bg-muted/20 p-3">
            <div className="grid gap-2 text-sm md:grid-cols-[auto,1fr,auto,1fr,auto,1fr,auto]">
              {flowSteps.map((step, index) => (
                <div key={step.key} className="contents">
                  <div
                    className={`rounded-md border px-2 py-1 text-center whitespace-nowrap transition-colors ${
                      activeModule === step.key
                        ? "border-primary bg-background font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {index + 1} {step.label}
                  </div>
                  {index < flowSteps.length - 1 ? (
                    <div className="flex items-center">
                      <div className="relative h-[2px] w-full bg-border/70">
                        <div
                          className={`absolute left-0 top-0 h-[2px] bg-primary transition-all ${
                            activeFlowIndex > index ? "w-full" : "w-0"
                          }`}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              基本信息不计入业务流，业务流聚焦：经营目标-扩大收入 → 组织关系突破 → 需求理解。
            </p>
          </div>

          <section className={sectionClass("manage-customer")} data-module="manage-customer">
            <h3 className="font-semibold">1、关联客户</h3>
            <div className="space-y-2">
              <Label htmlFor="customerId">选择客户 *</Label>
              <select
                id="customerId"
                name="customerId"
                defaultValue={selectedCustomerId || ""}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                required
              >
                <option value="">请选择客户（仅本人负责）</option>
                {customerOptions.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className={sectionClass("basic-info")} data-module="basic-info">
            <h3 className="font-semibold">基础信息（不计入业务流）</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectScenario">项目场景 *</Label>
                <Input id="projectScenario" name="projectScenario" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productLine">产品线 *</Label>
                <Input id="productLine" name="productLine" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyScenarioDescription">关键场景说明 *</Label>
              <Textarea id="keyScenarioDescription" name="keyScenarioDescription" rows={3} required />
            </div>
          </section>

          <section className={sectionClass("business-goal")} data-module="business-goal">
            <h3 className="font-semibold">1、经营目标-扩大收入</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetDimension">目标维度 *</Label>
                <select id="targetDimension" name="targetDimension" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="">请选择</option>
                  <option value="REPURCHASE">复购</option>
                  <option value="NEW_BUSINESS">新业务突破</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessStage">业务阶段 *</Label>
                <select id="businessStage" name="businessStage" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="">请选择</option>
                  <option value="初步接触">初步接触</option>
                  <option value="方案验证">方案验证</option>
                  <option value="商务签署">商务签署</option>
                  <option value="部署实施">部署实施</option>
                  <option value="持续运营">持续运营</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDescription">目标描述（KPI化+定义逻辑） *</Label>
              <Textarea id="targetDescription" name="targetDescription" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label>经营目标是否达成 *</Label>
              <div className="flex gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="businessGoalAchieved" value="YES" required />
                  是
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="businessGoalAchieved" value="NO" />
                  否
                </label>
              </div>
            </div>
          </section>

          <section className={sectionClass("org-breakthrough")} data-module="org-breakthrough">
            <h3 className="font-semibold">2、客户成功目标-组织关系突破</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orgCurrentState">整体组织关系现状 *</Label>
                <Textarea id="orgCurrentState" name="orgCurrentState" rows={3} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgChanges">变化情况 *</Label>
                <Textarea id="orgChanges" name="orgChanges" rows={3} required />
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">关键人条目</div>
              {stakeholders.map((person, index) => (
                <div key={`stakeholder-${index}`} className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <div className="grid gap-2 md:grid-cols-3">
                    <Input
                      placeholder="关键人姓名"
                      value={person.name}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].name = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                    <Input
                      placeholder="所属部门"
                      value={person.department}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].department = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                    <Input
                      placeholder="层级"
                      value={person.level}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].level = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Input
                      placeholder="关键人说明"
                      value={person.description}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].description = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                    <Input
                      placeholder="现状"
                      value={person.currentState}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].currentState = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                    <Input
                      placeholder="目标"
                      value={person.target}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].target = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                    <Input
                      placeholder="认可标准"
                      value={person.acceptanceCriteria}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].acceptanceCriteria = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                  </div>
                  <Input
                    placeholder="关键人认可变化分析"
                    value={person.changeAnalysis}
                    onChange={(event) => {
                      const next = [...stakeholders];
                      next[index].changeAnalysis = event.target.value;
                      setStakeholders(next);
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStakeholders((prev) => [...prev, emptyStakeholder()])}
              >
                新增关键人
              </Button>
            </div>
          </section>

          <section className={sectionClass("needs-understanding")} data-module="needs-understanding">
            <h3 className="font-semibold">3、客户成功目标-需求理解</h3>
            <div className="space-y-2">
              <Label htmlFor="businessNeedAnalysis">客户业务需求分析（业务流/数据流） *</Label>
              <Textarea id="businessNeedAnalysis" name="businessNeedAnalysis" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="attachments">附件上传</Label>
              <Input id="attachments" name="attachments" type="file" multiple />
            </div>
            <div className="space-y-2">
              <Label htmlFor="personalNeeds">关键人的个人需求（IT评价/KPI/OKR/中高层关注点） *</Label>
              <Textarea id="personalNeeds" name="personalNeeds" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smartGoal">客户成功目标（SMART） *</Label>
              <Textarea id="smartGoal" name="smartGoal" rows={3} required />
            </div>
            <div className="space-y-2">
              <Label>是否与客户完成对齐 *</Label>
              <div className="flex gap-6 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="alignedWithCustomer" value="YES" required />
                  是
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="radio" name="alignedWithCustomer" value="NO" />
                  否
                </label>
              </div>
            </div>
          </section>

          <section className="space-y-2 rounded-md border p-4">
            <Label htmlFor="ownerName">负责人（Owner） *</Label>
            <Input id="ownerName" name="ownerName" required defaultValue={managerName || ""} list="owner-options" />
            <datalist id="owner-options">
              {ownerOptions.map((owner) => (
                <option key={owner} value={owner} />
              ))}
            </datalist>
          </section>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled>
              上一步
            </Button>
            <Button type="button" variant="outline" disabled>
              保存草稿
            </Button>
            <Button type="submit">提交计划</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
