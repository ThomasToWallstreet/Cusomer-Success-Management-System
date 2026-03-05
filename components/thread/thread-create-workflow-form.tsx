"use client";

import { useMemo, useRef, useState } from "react";

import { createThreadWorkflowAction } from "@/app/(dashboard)/threads/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

type ContactOption = {
  id: string;
  customerId: string;
  name: string;
  department: string | null;
  level: string | null;
  satisfactionCurrent: string;
  satisfactionTarget: string;
  note?: string | null;
};

type ProjectOption = {
  id: string;
  customerId: string;
  name: string;
  productLine: string | null;
  targetDimension?: unknown;
  targetDescription?: string | null;
  businessStage?: string | null;
  businessGoalAchieved?: string | null;
  keyScenarioDescription?: string | null;
  note?: string | null;
};

type ScenarioOption = {
  id: string;
  customerId: string;
  name: string;
  businessNeedAnalysis?: string | null;
  personalNeeds?: string | null;
  smartGoal?: string | null;
  alignedWithCustomer: string | null;
  note?: string | null;
};

type ModuleKey =
  | "context-info"
  | "business-goal"
  | "org-breakthrough"
  | "needs-understanding";

type FlowStepKey = Exclude<ModuleKey, "context-info">;

const flowSteps: Array<{ key: FlowStepKey; label: string }> = [
  { key: "business-goal", label: "经营目标-扩大收入" },
  { key: "org-breakthrough", label: "客户成功-组织关系" },
  { key: "needs-understanding", label: "客户成功-价值兑现" },
];

function renderValue(value: unknown) {
  if (Array.isArray(value)) {
    const texts = value.filter((item) => typeof item === "string") as string[];
    return texts.length ? texts.join("、") : "-";
  }
  if (typeof value === "string") {
    const text = value.trim();
    return text || "-";
  }
  if (value === null || value === undefined) {
    return "-";
  }
  return String(value);
}

export function ThreadCreateWorkflowForm({
  customerOptions,
  contactOptions,
  projectOptions,
  scenarioOptions,
  selectedCustomerId,
  managerName,
  role,
}: {
  customerOptions: Array<{ id: string; name: string }>;
  contactOptions: ContactOption[];
  projectOptions: ProjectOption[];
  scenarioOptions: ScenarioOption[];
  selectedCustomerId?: string;
  managerName?: string;
  role?: string;
}) {
  const [selectedCustomerIdInForm, setSelectedCustomerIdInForm] = useState(selectedCustomerId || "");
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedProjectItemId, setSelectedProjectItemId] = useState("");
  const [selectedScenarioItemId, setSelectedScenarioItemId] = useState("");
  const [activeFlowStep, setActiveFlowStep] = useState<FlowStepKey>("business-goal");

  const availableContacts = useMemo(
    () => contactOptions.filter((item) => item.customerId === selectedCustomerIdInForm),
    [contactOptions, selectedCustomerIdInForm],
  );
  const availableProjects = useMemo(
    () => projectOptions.filter((item) => item.customerId === selectedCustomerIdInForm),
    [projectOptions, selectedCustomerIdInForm],
  );
  const availableScenarios = useMemo(
    () => scenarioOptions.filter((item) => item.customerId === selectedCustomerIdInForm),
    [scenarioOptions, selectedCustomerIdInForm],
  );

  const effectiveSelectedProjectItemId = availableProjects.some((item) => item.id === selectedProjectItemId)
    ? selectedProjectItemId
    : "";
  const effectiveSelectedScenarioItemId = availableScenarios.some((item) => item.id === selectedScenarioItemId)
    ? selectedScenarioItemId
    : "";
  const effectiveSelectedContactIds = selectedContactIds.filter((id) =>
    availableContacts.some((item) => item.id === id),
  );

  const selectedProject = availableProjects.find((item) => item.id === effectiveSelectedProjectItemId);
  const selectedScenario = availableScenarios.find((item) => item.id === effectiveSelectedScenarioItemId);
  const selectedContacts = availableContacts.filter((item) => effectiveSelectedContactIds.includes(item.id));

  const toggleContact = (contactId: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId],
    );
  };

  const sectionRefs = useRef<Record<FlowStepKey, HTMLElement | null>>({
    "business-goal": null,
    "org-breakthrough": null,
    "needs-understanding": null,
  });
  const sectionClass = "space-y-3 rounded-md border bg-background p-4";

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
            const currentModule = target?.closest("[data-module]")?.getAttribute("data-module") as ModuleKey | null;
            if (currentModule && currentModule !== "context-info") {
              setActiveFlowStep(currentModule);
            }
          }}
        >
          <input type="hidden" name="managerName" value={managerName || ""} />
          <input type="hidden" name="role" value={role || ""} />
          <input type="hidden" name="ownerName" value={managerName || ""} />

          <div className="rounded-md border bg-muted/20 p-3">
            <div className="grid gap-2 text-sm md:grid-cols-3">
              {flowSteps.map((step, index) => (
                <div key={step.key}>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setActiveFlowStep(step.key);
                      sectionRefs.current[step.key]?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                    className={`w-full cursor-pointer rounded-md border px-2 py-1 text-center whitespace-nowrap transition-all hover:bg-muted/40 ${
                      activeFlowStep === step.key
                        ? "border-primary bg-primary/10 font-semibold text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                        activeFlowStep === step.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </span>
                    {step.label}
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              新建计划仅引用客户管理主数据：项目清单（突破/续费/复购）、关键人清单、关键场景清单。
            </p>
          </div>

          <section className={sectionClass} data-module="context-info">
            <h3 className="font-semibold">基础信息</h3>
            <div className="space-y-2">
              <Label htmlFor="customerId">选择客户 *</Label>
              <select
                id="customerId"
                name="customerId"
                value={selectedCustomerIdInForm}
                onChange={(event) => {
                  setSelectedCustomerIdInForm(event.target.value);
                  setSelectedContactIds([]);
                  setSelectedProjectItemId("");
                  setSelectedScenarioItemId("");
                }}
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

          <section
            className={`${sectionClass} scroll-mt-24`}
            data-module="business-goal"
            ref={(element) => {
              sectionRefs.current["business-goal"] = element;
            }}
          >
            <h3 className="font-semibold">1、经营目标-扩大收入（项目清单（突破/续费/复购）主数据）</h3>
            <div className="space-y-2">
              <Label htmlFor="projectItemId">选择项目清单（突破/续费/复购） *</Label>
              <select
                id="projectItemId"
                name="projectItemId"
                value={effectiveSelectedProjectItemId}
                onChange={(event) => setSelectedProjectItemId(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                required
              >
                <option value="">请选择项目清单（突破/续费/复购）</option>
                {availableProjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedProject ? (
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <p><span className="text-muted-foreground">项目名称：</span>{renderValue(selectedProject.name)}</p>
                  <p><span className="text-muted-foreground">产品线：</span>{renderValue(selectedProject.productLine)}</p>
                  <p><span className="text-muted-foreground">目标维度：</span>{renderValue(selectedProject.targetDimension)}</p>
                  <p><span className="text-muted-foreground">业务阶段：</span>{renderValue(selectedProject.businessStage)}</p>
                  <p><span className="text-muted-foreground">经营目标是否达成：</span>{renderValue(selectedProject.businessGoalAchieved)}</p>
                  <p><span className="text-muted-foreground">关键场景说明：</span>{renderValue(selectedProject.keyScenarioDescription)}</p>
                </div>
                <p className="mt-2"><span className="text-muted-foreground">目标描述：</span>{renderValue(selectedProject.targetDescription)}</p>
                <p className="mt-2"><span className="text-muted-foreground">备注：</span>{renderValue(selectedProject.note)}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">请选择项目清单（突破/续费/复购）后查看主数据详情。</p>
            )}
          </section>

          <section
            className={`${sectionClass} scroll-mt-24`}
            data-module="org-breakthrough"
            ref={(element) => {
              sectionRefs.current["org-breakthrough"] = element;
            }}
          >
            <h3 className="font-semibold">2、客户成功-组织关系（客户关键人主数据）</h3>
            <div className="space-y-2">
              <Label>选择客户关键人（可多选） *</Label>
              <div className="space-y-2 rounded-md border p-3">
                {availableContacts.length ? (
                  availableContacts.map((item) => {
                    const checked = effectiveSelectedContactIds.includes(item.id);
                    return (
                      <label key={item.id} className="flex cursor-pointer items-start gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleContact(item.id)}
                          className="mt-0.5"
                        />
                        <span>
                          {item.name}
                          {item.department ? `（${item.department}${item.level ? `/${item.level}` : ""}）` : ""}
                          {` [${item.satisfactionCurrent}→${item.satisfactionTarget}]`}
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-xs text-muted-foreground">当前客户暂无关键人主数据。</p>
                )}
              </div>
              {effectiveSelectedContactIds.map((contactId) => (
                <input key={`contactId-${contactId}`} type="hidden" name="contactIds" value={contactId} />
              ))}
            </div>
            {selectedContacts.length ? (
              <div className="space-y-2">
                {selectedContacts.map((item) => (
                  <div key={`contact-card-${item.id}`} className="rounded-md border bg-muted/20 p-3 text-sm">
                    <div className="grid gap-2 md:grid-cols-2">
                      <p><span className="text-muted-foreground">姓名：</span>{renderValue(item.name)}</p>
                      <p><span className="text-muted-foreground">部门：</span>{renderValue(item.department)}</p>
                      <p><span className="text-muted-foreground">层级：</span>{renderValue(item.level)}</p>
                      <p><span className="text-muted-foreground">满意度：</span>{renderValue(item.satisfactionCurrent)} → {renderValue(item.satisfactionTarget)}</p>
                    </div>
                    <p className="mt-2"><span className="text-muted-foreground">备注：</span>{renderValue(item.note)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">请选择至少一个关键人后查看主数据详情。</p>
            )}
          </section>

          <section
            className={`${sectionClass} scroll-mt-24`}
            data-module="needs-understanding"
            ref={(element) => {
              sectionRefs.current["needs-understanding"] = element;
            }}
          >
            <h3 className="font-semibold">3、客户成功-价值兑现（关键场景清单主数据）</h3>
            <div className="space-y-2">
              <Label htmlFor="scenarioItemId">选择关键场景清单 *</Label>
              <select
                id="scenarioItemId"
                name="scenarioItemId"
                value={effectiveSelectedScenarioItemId}
                onChange={(event) => setSelectedScenarioItemId(event.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                required
              >
                <option value="">请选择关键场景清单</option>
                {availableScenarios.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedScenario ? (
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <div className="grid gap-2 md:grid-cols-2">
                  <p><span className="text-muted-foreground">场景名称：</span>{renderValue(selectedScenario.name)}</p>
                  <p><span className="text-muted-foreground">对齐情况：</span>{renderValue(selectedScenario.alignedWithCustomer)}</p>
                </div>
                <p className="mt-2"><span className="text-muted-foreground">客户业务需求分析：</span>{renderValue(selectedScenario.businessNeedAnalysis)}</p>
                <p className="mt-2"><span className="text-muted-foreground">关键人的个人需求：</span>{renderValue(selectedScenario.personalNeeds)}</p>
                <p className="mt-2"><span className="text-muted-foreground">客户成功目标（SMART）：</span>{renderValue(selectedScenario.smartGoal)}</p>
                <p className="mt-2"><span className="text-muted-foreground">备注：</span>{renderValue(selectedScenario.note)}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">请选择关键场景清单后查看主数据详情。</p>
            )}
          </section>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit">提交计划</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

