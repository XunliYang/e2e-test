---
name: openan-powers-migration
description: 指导迁移 agent 将 openfuyao-powers 技能集迁移适配到 openAN 社区（GitHub 组织 project-openan，目标仓库 openAN-powers）：提供 openAN 组件地图与依赖层级、六大类技能的适配规则（GitCode→GitHub MCP、Ginkgo→pytest/JUnit5/Vitest/Bats、测试用例 CSV 14 列→12 列、Allure→JUnit XML/Playwright report、GitCode CI→GitHub Actions 等）、目标仓库 frontmatter 与目录规范、五步迁移流程与验收清单；只产出迁移指导与逐项核对结论，不代替迁移 agent 执行实际迁移
---

# OpenAN Powers 迁移指导

核心定位：本 skill 是 openfuyao-powers → openAN-powers 迁移工作的「说明书」。它告诉迁移 agent：openAN 各项目是什么、彼此什么关系、每类技能要改哪些地方、改完如何验收。

它不负责：不执行实际迁移、不修改 openfuyao-powers 源技能、不对 project-openan 下任何仓库的业务代码做测试改造。

## 1. 输入契约

**必需提供（缺一项即 STOP 并提示补齐）：**

1. 目标仓库工作区（openAN-powers，或明确指定的待写入目录）
2. 迁移范围：全量迁移，或明确的技能名称清单

**可选：**

- 迁移追踪清单文件路径（默认在目标仓库根目录维护 `migration-checklist.md`，模板见 `templates/migration-checklist.md`）

## 2. 迁移总流程（五步）

1. **盘点**：枚举源仓库 `skills/` 下全部技能目录，按第 4 节分类表归入六类之一，写入迁移清单。
2. **定基线**：在目标仓库建立规范骨架（README 功能清单、AGENTS.md 能力矩阵、`skills/` 目录），规范与源仓库一致（见第 3 节）。
3. **逐项适配**：按 `references/adaptation-rules.md` 的分类规则逐个改写技能；每完成一个更新清单状态。
4. **自检**：对每个产出技能执行第 5 节验收清单；不通过则回到第 3 步。
5. **收口**：迁移清单状态全部置为完成，输出汇总（已迁移 / 降级迁移 / 明确不迁移及理由）。

## 3. 目标仓库规范（openAN-powers 沿用 openfuyao-powers 同源规范）

- 每个技能目录根下只允许主文件 `SKILL.md`（`SKILL` 全大写，大小写敏感）；附属文件只能放入 `references/`、`templates/`、`scripts/`、`assets/` 四个子目录之一，不得另起顶层目录
- `SKILL.md` 必须含 YAML frontmatter：`name` 与目录名完全一致（kebab-case，不加引号）；`description` 为单行完整字符串，禁止 `>-`、`>`、`|` 折行
- `SKILL.md` 内引用一律用相对路径（如 `references/foo.md`）
- 每新增/删除一个技能，同步更新目标仓库 README 功能清单与 AGENTS.md 能力矩阵
- 术语统一：组织名 `openFuyao` → `openAN` / `project-openan`；平台 `GitCode` → `GitHub`
- 命名约定：仓库 `skills/` 下目录**不加** `openan-` 前缀（如 `github-issue-creator`）；安装到本机技能目录（`~/.agents/skills/`）时统一加 `openan-` 前缀，隔离同名 openfuyao 技能

## 4. 技能分类与适配策略（概览）

| 分类 | 源技能 | 适配策略（详规见 `references/adaptation-rules.md`） |
| ---- | ---- | ---- |
| 平台协作类 | `gitcode-issue-creator`、`gitcode-issue-fixer`、`gitcode-pr-manager`、`gitcode-pr-review`、`gitcode-pr-gate-diagnoser`、`gitcode-pr-changie`、`gitcode-pr-codecheck`、`cve-fixer`、`gitcode-issue-dispatcher`、`e2e-bug-issue-creator` | GitCode MCP → GitHub MCP 工具逐一映射；平台属性（看板/里程碑/issue_severity）降级为 GitHub labels 或显式声明删除；改名 `github-*`（仓库目录不加前缀） |
| 测试用例生成类 | `feature-level-test-cases-gen`、`dfx-test-cases-gen`、`test-cases-reviewer`、`test-cases-generator` | CSV 模板 14 列 → openan 12 列模板，新增 `language_profile` / `component_deps` / `protocol_primitive` 三列；FIT/DFX 判据与评审 checklist 保留 |
| E2E 测试执行类 | `e2e-test-code-gen`、`e2e-test-runner`、`e2e-test-regression`、`e2e-failure-analyzer`、`e2e-issue-retest`、`e2e-issue-verifier`、`e2e-failure-cluster-board` | Ginkgo → Python pytest / Java JUnit5+Maven / Shell Bats；Playwright 保留；证据格式 Allure3 → JUnit XML / Playwright report；改名 `e2e-*`（仓库目录不加前缀） |
| 研发流程类 | `requirement-decomposition`、`solution-design`、`ofep-converter`、`ofep-index-builder`、`design-reviewer`、`design2code` | 语言无关、改动最小：替换社区术语与链接；OFEP 为 openFuyao 专属概念，openAN 无对应物，需显式决策（重命名改造或标记不迁移） |
| 质量门禁类 | `code-reviewer`、`doc-reviewer`、`openapi-doc-check`、`code-doc-consistency-check`、`repo-insight`、`skill-governor` | 语言无关者轻量替换；`openapi-doc-check` / `code-doc-consistency-check` 的 go-restful 场景在 openAN（无 Go 仓库）默认标记不迁移或通用化 |
| CI 流水线类 | `pipeline-issue-reviewer`、`pipeline-pr-gate-diagnoser` | GitCode CI 环境变量与 ci 工具 → GitHub Actions（`$GITHUB_*`、checks API、workflow re-run） |

## 5. openAN 项目地图（迁移 agent 必读）

迁移 agent 必须先读 `references/project-map.md`，其中包含：

- openAN 组件关系图与依赖层级（5 层，决定测试迁移的先后顺序）
- 17 个测试条目的仓库归属：**`registry-center`、`orchestration-center`、`observability-center` 各为「后端 + 前端」单仓库**，不得当成 6 个独立仓库
- 各仓库语言、测试框架、端口、关键依赖版本约束
- 排除项：`integration-test` 仓库**不在迁移与测试范围**

关键事实速记：

- 协议层：`a2a-t-sdk-python` / `a2a-t-sdk-java`（同契约）
- 引擎层：`workflow-engine-sdk-python` / `-java` → 依赖 `a2a-t-sdk>=1.2.0,<2`
- 中心层：`orchestration-center` → 依赖 `workflow-exec-engine>=0.1.1,<0.2` + `a2a-t-sdk`，运行时依赖 `registry-center`（`AGENT_REGISTRY_URL` / `openan-net`）
- 可观测性族：`observability-center` → 使用 `observability-sdk-python`（另有 java/ts 变体）
- 独立组件：`knowledge-service`、`openan-portal`、`project-openan.github.io`、`openan-installation` 与其它项目无代码/运行时依赖

## 6. 验收清单（每个迁移产出技能逐项核对）

- [ ] frontmatter 合规：`name` 与目录名一致；`description` 单行完整字符串
- [ ] 目录结构合规：根下仅 `SKILL.md`，附属文件归入四个允许子目录
- [ ] 无 GitCode 残留：正文、脚本、模板中的 `gitcode` / `GITCODE_TOKEN` / gitcode.com 链接已全部替换为 GitHub 等价物（保留为历史说明的除外）
- [ ] 无 openFuyao 专属概念残留：OFEP、看板、季度版本里程碑、`issue_severity`、SIG 等已替换为 openAN 等价概念或显式声明降级/删除
- [ ] 目标仓库 README 功能清单与 AGENTS.md 能力矩阵已同步
- [ ] 迁移清单中该技能状态已更新，降级或不迁移的附理由

## 7. 输出

1. 迁移指导与逐项核对结论（迁移 agent 执行时）
2. 迁移完成后输出汇总：已迁移清单、降级迁移清单、不迁移清单及理由
