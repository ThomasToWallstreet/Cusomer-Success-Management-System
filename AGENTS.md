# AGENTS.md instructions for E:\Cursor\深圳区KA客户成功管理系统-VScode

## Skills

A skill is a set of local instructions to follow that is stored in a `SKILL.md` file.

### Available skills

- ui-ux-pro-max: Advanced UI/UX workflow and tooling for product interface design and implementation. (file: E:/Cursor/深圳区KA客户成功管理系统-VScode/.cursor/skills/ui-ux-pro-max/SKILL.md)
- skill-creator: Guide for creating effective skills. (file: C:/Users/45448/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into `$CODEX_HOME/skills` from curated lists or GitHub repo paths. (file: C:/Users/45448/.codex/skills/.system/skill-installer/SKILL.md)

### How to use skills

- If a user names a skill (with `$SkillName` or plain text) or the task clearly matches a skill description, use that skill for the turn.
- If a skill cannot be read, report it briefly and continue with the best fallback.
- Load only the minimum files needed from each skill to complete the request.

## Non-Negotiable Edit Rule

- For Chinese source files (`.ts`, `.tsx`, `.prisma`), only use `apply_patch` for edits.
- Do NOT use script-based bulk replace, line-overwrite, or regex-wide rewrite.
- If parsing/encoding anomalies appear, rollback first, then re-apply a minimal patch.


## Synced Full Rules From thomas-collaboration.md

---
description: Thomas项目协作规则（沟通、实施、验证）
alwaysApply: true
---

# Thomas 协作规则（强制）

## 称呼与语言
- 每次回复必须称呼用户为“Thomas”。
- 全程使用简体中文，表达直接、可执行。
- 开始任何分析、修改、验证前，必须先读取并遵循本文件与项目内 `AGENTS.md` 最新内容。

## 需求理解与确认
- 先复述目标与范围，再进入实现或方案。
- 当用户指“这个页面这一块”时，先定位组件并给出可选项确认，避免误改。
- 如果用户强调“全局生效”，禁止只按某个URL参数做局部处理。

## 实施与反馈
- 采用最小改动原则：优先改现有组件与数据结构，不轻易引入新模型。
- 结构性改动时，先给计划（目标、文件、步骤、验证点），再执行。
- 进度反馈使用短句：正在做什么、已完成什么、下一步是什么。

## 执行闸门（新增强制）
- 每次收到新需求后，开始任何搜索/修改前，必须先读取 `AGENTS.md` 与 `thomas-collaboration.md`。
- 第一条工作更新必须输出“本次必执行规则清单”（至少包含：称呼Thomas、中文回复、是否迁移、是否重启、是否rebuild、命令按dev/prod分开）。
- 任何代码改动前，必须先给出三项明确判断：`数据库迁移`、`Web服务重启`、`镜像重建(rebuild)`（需要/不需要 + 原因）。
- 若遗漏上述任一项，禁止进入代码修改步骤。

## 验证与质量门禁
- 不得在未验证时宣称“已完成”。
- 至少做3类验证：引用/调用检查、lint或类型检查、页面行为核对点。
- 若用户反馈“页面没变化”，优先排查运行环境（dev/prod、容器、重启状态）再判断代码问题。
- 每次代码迭代时，需要说明是否涉及前后端改动，并给出需要重启生效的模块（如重启web服务/需要做数据库迁移）。
- 严格执行编码和中文乱码问题，一定不要在修改代码的时候引入因编码导致的污染。
## 运行环境与部署判断（Docker）
- 必须明确区分开发与生产：`docker-compose.dev.yml` 为开发环境，`docker-compose.yml` 为生产环境。
- 强制规则：不讨论“热更新/热添加/热升级”作为生效手段，统一按重启 `web` 服务处理。
- 开发环境：代码改动后默认执行 `docker compose -f docker-compose.dev.yml restart web`。
- 生产环境：代码发布默认执行 `docker compose -f docker-compose.yml up -d --build web`。
- 回答“是否需要迁移/重启”时必须给出明确结论（需要/不需要）和对应命令，不得使用模糊表述。
- 若本次未改 `prisma/schema.prisma`：默认结论为“不需要数据库迁移”；若改了 schema：必须提示执行迁移流程。
- 每次最终回复都必须给出“数据库迁移命令”和“Web 服务命令”（按 dev/prod 分开）；即使判断为不需要，也要给出“无需执行”的结论和“如需执行可用的标准命令”。

## UI/业务一致性
- 风险、状态、阶段等文案必须与业务口径一致（如低/中/高风险）。
- 颜色仅用于风险/状态语义，不做装饰性上色。
- 列表与详情页中的同一业务字段，展示口径保持一致。

## 交付格式
- 结论先行：先给结果，再列变更文件与验证结果。
- 路径、命令、组件名使用反引号标注，便于Thomas快速定位。

## 交付末尾强制模板（每次改动后必须输出）
- 在“最终回复”末尾，必须追加以下三行固定判断，禁止遗漏：
  - `数据库迁移：需要/不需要（原因）`
  - `Web服务重启：需要/不需要（dev与prod分别说明）`
  - `镜像重建(rebuild)：需要/不需要（dev与prod分别说明）`
- 在上述三行之后，必须追加命令区块（按环境拆分）：
  - `数据库迁移命令（dev）`、`数据库迁移命令（prod）`
  - `Web服务命令（dev）`、`Web服务命令（prod）`
  - `镜像命令（dev）`、`镜像命令（prod）`
- 当为 Docker 项目时，命令必须按环境分开给出，不得混写：
  - 开发环境（`docker-compose.dev.yml`）：默认 `docker compose -f docker-compose.dev.yml restart web`
  - 生产环境（`docker-compose.yml`）：代码变更默认 `docker compose -f docker-compose.yml up -d --build web`
- 若判断为“不需要”，也必须明确写出“不需要”的结论与依据，不得省略该行。

## 编码防污染强制条款（新增）
- 中文源码（`.ts` / `.tsx` / `.prisma`）只允许 `apply_patch` 编辑。
- 如 `apply_patch` 失败，必须暂停并向 Thomas 说明，不得改用覆盖写入。
- 任何结构改动前后，必须执行：`node scripts/check-encoding.mjs`。
- 提交前必须执行：`node scripts/check-encoding.mjs --staged`，未通过禁止提交。
- 每次最终交付必须汇报：编码修复结果、BOM 清理结果、中文字段回归核对结果。
