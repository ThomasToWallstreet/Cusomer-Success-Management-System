# 深圳区KA客户成功管理系统（一期MVP）

技术栈：Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma + PostgreSQL  
交付形态：Docker / Docker Compose（dev 热更新 + prod 交付）

## 功能范围

- 仪表盘：
  - 支持“当前角色 + 当前经理”视角筛选客户后查看总体进展、阶段分布、阻塞项和定性分析摘录
- 客户成功计划模块（Key Project Scenario）：
  - 客户为一级维度，每个客户下可维护多个关键场景
  - 客户成功计划列表：筛选 + 高信息密度表格（仅显示当前经理负责客户）
  - 客户成功计划新建：基础字段录入，默认阶段/风险（客户范围受经理映射限制）
  - 客户成功计划详情：sticky 信息条、6阶段 stepper、分段 JSON 表单、关联周报 timeline
- 周报模块：
  - 周报创建：先选客户，再选该客户下关键场景（禁止跨客户关联）
  - 周报列表：按周筛选，按 owner 汇总统计（客户范围受经理映射限制）
  - 周报详情：只读
- 客户管理模块（客户清单）：
  - 维护客户清单与大客户服务经理归属关系（主管可维护，经理只读）
  - 主管支持网页端直接新增/编辑/删除客户清单全字段
  - 支持生产 CSV 全量替换导入（双层表头），并支持导出
  - 支持超宽表格横向拖拽浏览（鼠标按住左右拖动 + 原生滚动条）
  - 集团客户重点分支支持分行输入与分行展示
  - 权限：仅大客户服务主管可维护；大客户服务经理仅可查看本人客户清单

## 本机运行（不使用 Docker）

### 1) 安装依赖

```bash
npm install
```

### 2) 配置环境变量

创建 `.env`：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ka_csm?schema=public
```

### 3) 初始化数据库

```bash
npm run prisma:generate
npm run prisma:migrate:dev
npm run prisma:seed
npm run backfill:customer-id
```

### 4) 启动开发服务

```bash
npm run dev
```

访问 `http://localhost:3000`。

### 5) 导入生产客户清单（全量替换）

```bash
npm run import:customer-list -- "原型文档/深圳区 的副本.CSV"
```

- 该命令会全量替换客户清单业务数据（`CustomerListEntry` + `ManagerCustomerAssignment`）。
- 导入前建议先执行“导出客户清单”做备份。

## Docker 开发（dev 热更新）

```bash
docker compose -f docker-compose.dev.yml up --build
```

- `web` 会执行：`prisma generate + prisma migrate dev + npm run dev`
- 代码挂载到容器，支持热更新
- `node_modules` 使用容器卷，规避 Windows 挂载冲突

停止并删除容器：

```bash
docker compose -f docker-compose.dev.yml down
```

## Docker 生产（prod 交付）

### 1) 构建并启动

```bash
docker compose up -d --build
```

### 2) 执行迁移（独立 migrate 服务）

```bash
docker compose run --rm migrate
```

### 3) 查看日志

```bash
docker compose logs -f web
```

## 迁移归零后首启（一次性）

当需要将历史迁移彻底归零并重建为单基线时，按以下步骤执行：

```bash
# 1) 备份并清空迁移目录（示例：PowerShell）
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$backupDir = "prisma/migrations_backup_$ts"
New-Item -ItemType Directory -Path $backupDir | Out-Null
Copy-Item -Recurse -Force "prisma/migrations/*" $backupDir
Remove-Item -Recurse -Force "prisma/migrations/*"

# 2) 卷级清空数据库并仅启动 DB
docker compose down -v
docker compose up -d db

# 3) 生成单基线迁移（本地连接 DB）
$env:DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ka_csm?schema=public"
npx prisma migrate dev --name baseline_init --create-only

# 4) 重新构建 migrate 镜像并落库
docker compose build --no-cache migrate
docker compose run --rm migrate

# 5) 初始化与恢复业务数据
npm run prisma:seed
npm run import:customer-list -- "原型文档/深圳区 的副本.utf8.csv"

# 6) 启动应用
docker compose up -d web
```

验证建议：

```bash
# 迁移记录应仅有 baseline
docker compose exec db psql -U postgres -d ka_csm -c 'SELECT migration_name FROM "_prisma_migrations" ORDER BY migration_name;'
```

## 日常数据库迁移 SOP（严格执行）

### 开发环境（本地）

```bash
# 修改 schema 后，只能用 migrate dev 产出新迁移
npx prisma migrate dev --name <feature_name>
npx prisma generate
npm run lint
```

### 提交规范

- 必须一并提交：`prisma/schema.prisma` + 新增 `prisma/migrations/<timestamp>_<name>/migration.sql`
- 禁止修改历史迁移文件
- 禁止将 `prisma db push` 作为常规流程（仅限紧急救火且需评审确认）

### 部署环境

```bash
# 仅允许 deploy，不允许 dev/reset
npx prisma migrate deploy
```

禁止在部署环境执行：

- `npx prisma migrate dev`
- `npx prisma migrate reset`
- `npx prisma db push`

## 数据模型

- `Customer`：客户主表，是关键场景与周报的一级归属对象。
- `ManagerCustomerAssignment`：经理-客户映射表，唯一约束 `(managerName, customerId)`。
- `KeySuccessScenario`：关键场景主表，含阶段、状态、风险和分段 JSON 字段。
- `KeySuccessScenario.customerId`：关键场景归属客户。
- `WeeklyReport`：周报主表。
- `WeeklyReport.customerId`：周报归属客户。
- `WeeklyReportThread`：周报与关键场景关联表，唯一约束 `(weeklyReportId, threadId)`。

## 常见问题（FAQ）

### 1) Prisma 迁移冲突

- 首选按“日常数据库迁移 SOP”执行，不要直接手动修补历史迁移链。
- 若出现迁移链断裂（如顺序错误、缺失历史文件），请走“迁移归零后首启（一次性）”流程。
- 生产环境仅允许 `prisma migrate deploy`，不要执行 reset/dev/push。

### 2) Windows 挂载导致 `node_modules` 异常

- 已在 `docker-compose.dev.yml` 里将 `/app/node_modules` 设为独立卷。
- 建议在 WSL2 路径下开发，文件 IO 更稳定。

### 3) Docker 启动顺序问题

- Compose 已为 `db` 增加 `healthcheck`。
- `migrate` 和 `web` 依赖 DB 就绪后再执行。

### 4) ownerName 无登录导致数据不一致

- 一期通过输入建议值和周报 owner 过滤降低污染。
- 后续接入登录后可做 ownerName 映射清洗。

### 5) 客户清单 CSV 规范

- 文件编码：UTF-8（建议 with BOM，兼容 Windows 双击 Excel 打开）。
- 表头采用双层结构，需与 `原型文档/深圳区 的副本.CSV` 一致。
- 字段包含：客户名称、集团客户重点分支、行业、客户类型、阶段、25/26 订单业绩、增长率、2026 年阵型（销售/售前（安全）/售前（云）/大客户服务经理）等。
- 导入策略为全量替换，若校验失败将整批回滚。

## 参考文档

- UI 线框依据：`docs/ui-wireframe.md`
- 测试清单：`docs/test-checklist.md`
- 验收标准：`docs/mvp-acceptance.md`
