# MVP 验收标准

## 业务对象与流程

- 存在 `Customer` 主实体，系统以客户为一级视角。
- 存在 `ManagerCustomerAssignment`，用于经理与客户映射，唯一约束 `(managerName, customerId)`。
- 存在 `KeySuccessScenario`（关键场景）并承载 6 阶段推进。
- 一条关键场景仅有一个 `ownerName`（字符串）。
- `WeeklyReport` 与关键场景通过 `WeeklyReportThread` 多对多关联。
- 每份周报必须归属一个客户，且只能关联该客户下关键场景。

## 功能范围

### 客户管理

- 客户管理页（客户清单）：主表按生产 CSV 双层表头展示全部字段。
- 支持 CSV 导入/导出；导入策略为全量替换。
- 导入错误可返回明细，且整批回滚不写入脏数据。
- 权限：仅大客户服务主管可维护；大客户服务经理仅可查看本人客户清单。

### 客户成功计划

- 列表页：高信息密度表格 + 左侧筛选，仅展示当前经理负责客户的数据。
- 新建页：创建基础信息，默认阶段与风险正确，且客户受经理映射约束。
- 详情页：sticky 信息条、阶段 stepper、可折叠阶段卡、关联周报 Timeline。

### 周报

- 创建页：客户 + owner + 周区间 + 多关键场景关联 + 周报正文。
- 列表页：按周筛选 + owner 汇总统计，仅在当前经理客户范围内。
- 详情页：只读展示，含关联关键场景跳转。

### 仪表盘

- 支持角色视角切换：主管全量、经理本人范围。
- 指标随客户过滤联动：总量、阶段分布、风险分布、阻塞项和定性分析摘录。

## 技术与交付

- Next.js App Router + TypeScript + Tailwind + shadcn/ui。
- Prisma + PostgreSQL，含索引与唯一约束。
- Docker Compose：
  - `docker-compose.dev.yml`：支持热更新。
  - `docker-compose.yml` + `Dockerfile`：可 prod 交付。
- README 包含一键启动、迁移命令、常见问题。
