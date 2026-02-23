# UI Wireframe Basis (ui-ux pro skill)

本文件沉淀三页原型约束，作为 MVP 实现依据。

## 1) 线程列表页

- 布局：左侧筛选栏 + 中间高密度表格（右侧抽屉预览作为后续增强）。
- 筛选：`customer`、`ownerName`、`stage`、`riskLevel`、`keyword`。
- 表格列：客户、关键人、关键项目场景、产品线、owner、阶段、风险、nextAction、更新时间。
- 风格：中性色为主，仅风险与状态使用颜色。
- 组件映射：`Card` + `Input` + `Select` + `Table` + `Badge`。

## 2) 线程详情页

- 顶部 sticky 信息条：客户、场景、owner、当前阶段、风险、nextAction。
- 6 阶段 stepper：展示顺序推进，可回退；状态支持进行中/阻塞/完成。
- 阶段表单：折叠卡片，MVP 先存 JSON。
- 底部：关联周报 Timeline（最近 5 条，含周区间和摘要）。
- 组件映射：`Accordion` + `Textarea` + `Badge` + 自定义 `Stepper/Timeline`。

## 3) 周报模块页

- 创建页：ownerName、weekStart/weekEnd、关联线程多选、summary/risks/nextWeekPlan/needSupport。
- 列表页：按周筛选；按 owner 汇总统计（周报数、红黄绿线程数、阻塞线程数）；可进详情只读页。
- 组件映射：`Input(date)` + `Textarea` + `Card` + `Table`。

## UI 规则

- 简约高效，高信息密度优先。
- 颜色语义固定：风险与状态才可用色，避免装饰性颜色。
- server-first：页面优先服务端渲染，交互以 Server Actions 为主。

## ui-ux pro skill prompts

### Prompt 1: 线程列表页

```text
请为“深圳区KA客户成功管理系统（MVP）”设计线程列表页（Key Project Scenario List），输出低保真到中保真线框。
硬性约束：
1) 风格=简约高效，高信息密度，尽量少装饰。
2) 页面布局：左侧固定筛选栏 + 中间主表格；右侧抽屉预览可选（没有也可以）。
3) 表格列必须包含：客户、关键人、关键项目场景、产品线、owner、阶段、风险、nextAction、更新时间。
4) 筛选必须包含：客户/owner/阶段/风险/关键字。
5) 颜色只允许用于“风险和状态”，其余尽量中性色。
6) 给出：页面信息架构、组件清单（建议 shadcn/ui 组件）、交互说明（筛选、排序、分页/无限滚动建议）、响应式策略。
7) 输出必须可直接指导 Next.js + Tailwind + shadcn/ui 实现。
```

### Prompt 2: 线程详情页

```text
请设计线程详情页（Key Project Scenario Detail），强调连续推进工作流。
硬性约束：
1) 顶部 sticky 信息条（客户、关键项目场景、owner、当前阶段、风险、nextAction）。
2) 6阶段 stepper 必须可视化：BASIC_INFO -> BUSINESS_GOAL -> ORG_RELATION -> SUCCESS_DEFINITION -> KEY_ACTIVITIES -> EXECUTION。
3) 每阶段使用可折叠卡片表单，支持“进行中/阻塞/完成”状态表达。
4) 页面底部必须有关联周报 Timeline（最近5条摘要）。
5) 颜色仅用于风险和状态。
6) 输出内容：线框图说明、阶段卡片字段建议（MVP JSON映射）、交互流（推进/回退/阻塞）、组件映射（shadcn/ui + 自定义 Stepper/Timeline）。
7) 设计结果需便于服务端优先渲染（server-first）实现。
```

### Prompt 3: 周报创建与列表汇总页

```text
请设计周报模块两页：
A) 周报创建页
B) 周报列表/汇总页
硬性约束：
1) 创建页字段：ownerName、weekStart/weekEnd（默认本周）、关联线程多选（优先按owner过滤）、summary、risks、nextWeekPlan、needSupport。
2) 列表/汇总页：按周筛选；按owner分组统计（周报数、红黄绿线程数、阻塞线程数）；支持进入周报详情（只读）。
3) 风格简约高效，颜色仅用于风险/状态。
4) 输出：页面结构、关键交互（多选线程、过滤、统计卡片）、组件建议（shadcn/ui）、可用性细节（长文本、空状态、错误提示）。
5) 结果需可直接落地 Next.js App Router + Server Actions。
```
