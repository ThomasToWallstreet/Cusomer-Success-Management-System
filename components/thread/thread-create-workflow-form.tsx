"use client";

import { useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { createThreadWorkflowAction } from "@/app/(dashboard)/threads/actions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessStageOptions } from "@/lib/constants/domain";
import { cn } from "@/lib/utils";

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

const productLineOptions = [
  "AC",
  "AF",
  "AD",
  "aDesk",
  "XDR",
  "aES",
  "安全服务",
  "MSS",
  "GPT",
  "HCI",
  "aTrust",
  "SIP",
  "SASE",
  "EDS",
  "AI安全平台",
  "SG",
  "SDDC",
  "CSSP",
  "VPN",
] as const;

const targetDimensionOptions = ["复购", "新业务突破", "续约"] as const;
const businessGoalResultOptions = [
  "复购已下单",
  "复购机会已立项",
  "续费已达成",
  "突破业务价值已兑现",
  "未达成",
] as const;
const orgCurrentStateOptions = [
  "充分信赖",
  "信任支持",
  "基本满意",
  "不够满意",
  "严重不满",
] as const;
const orgChangesOptions = [
  "提升至充分信赖",
  "提升至信任支持",
  "下降至严重不满",
  "下降至不够满意",
  "无变化",
  "有非常正向的变化",
] as const;
const stakeholderCurrentOptions = ["认可", "一般", "无感知", "不满意"] as const;
const stakeholderTargetOptions = ["认可", "一般", "无感知", "严重不满"] as const;
const alignedWithCustomerOptions = ["是-充分对齐", "是-部分对齐", "否-未对齐"] as const;

export function ThreadCreateWorkflowForm({
  customerOptions,
  selectedCustomerId,
  managerName,
  role,
}: {
  customerOptions: Array<{ id: string; name: string }>;
  selectedCustomerId?: string;
  managerName?: string;
  role?: string;
}) {
  const [stakeholders, setStakeholders] = useState<StakeholderRow[]>([emptyStakeholder()]);
  const [activeFlowStep, setActiveFlowStep] = useState<FlowStepKey>("business-goal");
  const [isProductLineOpen, setIsProductLineOpen] = useState(false);
  const [selectedProductLines, setSelectedProductLines] = useState<string[]>([]);
  const [isTargetDimensionOpen, setIsTargetDimensionOpen] = useState(false);
  const [selectedTargetDimensions, setSelectedTargetDimensions] = useState<string[]>([]);
  const stakeholdersJson = useMemo(() => JSON.stringify(stakeholders), [stakeholders]);
  const productLineSummary = useMemo(() => {
    if (selectedProductLines.length === 0) {
      return "请选择产品线（可多选）";
    }
    if (selectedProductLines.length <= 3) {
      return selectedProductLines.join("、");
    }
    return `${selectedProductLines.slice(0, 3).join("、")} 等 ${selectedProductLines.length} 项`;
  }, [selectedProductLines]);
  const targetDimensionSummary = useMemo(() => {
    if (selectedTargetDimensions.length === 0) {
      return "请选择目标维度（可多选）";
    }
    if (selectedTargetDimensions.length <= 3) {
      return selectedTargetDimensions.join("、");
    }
    return `${selectedTargetDimensions.slice(0, 3).join("、")} 等 ${selectedTargetDimensions.length} 项`;
  }, [selectedTargetDimensions]);
  const sectionRefs = useRef<Record<FlowStepKey, HTMLElement | null>>({
    "business-goal": null,
    "org-breakthrough": null,
    "needs-understanding": null,
  });
  const sectionClass = "space-y-3 rounded-md border bg-background p-4";
  const toggleProductLine = (option: string) => {
    setSelectedProductLines((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
  };
  const toggleTargetDimension = (option: string) => {
    setSelectedTargetDimensions((prev) =>
      prev.includes(option) ? prev.filter((item) => item !== option) : [...prev, option],
    );
  };

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
          <input type="hidden" name="stakeholdersJson" value={stakeholdersJson} />

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
              用于大客户服务经理按客户业务流推进制定客户成功计划：经营目标-扩大收入 → 组织关系突破 → 需求理解。
            </p>
          </div>

          <section className={sectionClass} data-module="context-info">
            <h3 className="font-semibold">基础信息（关联客户与基础信息）</h3>
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="projectScenario">项目场景 *</Label>
                <Input id="projectScenario" name="projectScenario" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productLine">产品线（多选） *</Label>
                <Popover open={isProductLineOpen} onOpenChange={setIsProductLineOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="productLine"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isProductLineOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        selectedProductLines.length === 0 && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate">{productLineSummary}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                    <div className="max-h-64 space-y-1 overflow-y-auto">
                      {productLineOptions.map((option) => {
                        const selected = selectedProductLines.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleProductLine(option)}
                            className={cn(
                              "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                              selected ? "bg-muted/50" : "hover:bg-muted/40",
                            )}
                          >
                            <span
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-[3px] border",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background",
                              )}
                            >
                              {selected ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedProductLines.map((option) => (
                  <input key={`productLine-${option}`} type="hidden" name="productLine" value={option} />
                ))}
                <p className="text-xs text-muted-foreground">点击下拉后勾选，可重复点击取消。</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="keyScenarioDescription">关键场景说明 *</Label>
              <Textarea id="keyScenarioDescription" name="keyScenarioDescription" rows={3} required />
            </div>
          </section>

          <section
            className={`${sectionClass} scroll-mt-24`}
            data-module="business-goal"
            ref={(element) => {
              sectionRefs.current["business-goal"] = element;
            }}
          >
            <h3 className="font-semibold">1、经营目标-扩大收入</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="targetDimension">目标维度（多选） *</Label>
                <Popover open={isTargetDimensionOpen} onOpenChange={setIsTargetDimensionOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="targetDimension"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isTargetDimensionOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        selectedTargetDimensions.length === 0 && "text-muted-foreground",
                      )}
                    >
                      <span className="truncate">{targetDimensionSummary}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-1" align="start">
                    <div className="space-y-1">
                      {targetDimensionOptions.map((option) => {
                        const selected = selectedTargetDimensions.includes(option);
                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() => toggleTargetDimension(option)}
                            className={cn(
                              "flex w-full items-center rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                              selected ? "bg-muted/50" : "hover:bg-muted/40",
                            )}
                          >
                            <span
                              className={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-[3px] border",
                                selected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background",
                              )}
                            >
                              {selected ? <Check className="h-3 w-3" /> : null}
                            </span>
                            <span>{option}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
                {selectedTargetDimensions.map((option) => (
                  <input key={`targetDimension-${option}`} type="hidden" name="targetDimension" value={option} />
                ))}
                <p className="text-xs text-muted-foreground">点击下拉后勾选，可重复点击取消。</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessStage">业务阶段 *</Label>
                <select id="businessStage" name="businessStage" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="">请选择</option>
                  {businessStageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDescription">目标描述（KPI化+定义逻辑） *</Label>
              <Textarea
                id="targetDescription"
                name="targetDescription"
                rows={3}
                placeholder="//复购机会是怎么定义的//续费是怎么定义的//为什么要订新业务突破的目标"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessGoalAchieved">经营目标是否达成 *</Label>
              <select
                id="businessGoalAchieved"
                name="businessGoalAchieved"
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
          </section>

          <section
            className={`${sectionClass} scroll-mt-24`}
            data-module="org-breakthrough"
            ref={(element) => {
              sectionRefs.current["org-breakthrough"] = element;
            }}
          >
            <h3 className="font-semibold">2、客户成功-组织关系</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="orgCurrentState">整体组织关系现状 *</Label>
                <select
                  id="orgCurrentState"
                  name="orgCurrentState"
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
                <select id="orgChanges" name="orgChanges" className="h-9 w-full rounded-md border bg-background px-3 text-sm" required>
                  <option value="">请选择</option>
                  {orgChangesOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium">关键人条目</div>
              {stakeholders.map((person, index) => (
                <div key={`stakeholder-${index}`} className="space-y-2 rounded-md border bg-muted/20 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">关键人 {index + 1}</div>
                    {stakeholders.length > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setStakeholders((prev) => prev.filter((_, personIndex) => personIndex !== index))
                        }
                      >
                        - 删除
                      </Button>
                    ) : null}
                  </div>
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
                      placeholder="关键人说明：1、为什么定义到这个人，怎么识别的//是不是承接了市场bp//有没有遗漏 2、这个人还有没有其他关联场景"
                      value={person.description}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].description = event.target.value;
                        setStakeholders(next);
                      }}
                    />
                    <select
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={person.currentState}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].currentState = event.target.value;
                        setStakeholders(next);
                      }}
                    >
                      <option value="">满意度现状</option>
                      {stakeholderCurrentOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                      value={person.target}
                      onChange={(event) => {
                        const next = [...stakeholders];
                        next[index].target = event.target.value;
                        setStakeholders(next);
                      }}
                    >
                      <option value="">目标</option>
                      {stakeholderTargetOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
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

          <section
            className={`${sectionClass} scroll-mt-24`}
            data-module="needs-understanding"
            ref={(element) => {
              sectionRefs.current["needs-understanding"] = element;
            }}
          >
            <h3 className="font-semibold">3、客户成功-价值兑现</h3>
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
              <Label htmlFor="alignedWithCustomer">是否与客户完成对齐 *</Label>
              <select
                id="alignedWithCustomer"
                name="alignedWithCustomer"
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
