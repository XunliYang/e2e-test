# 技能适配规则（openfuyao-powers → openAN-powers）

> 按 `SKILL.md` 第 4 节六大类执行。每类给出：改名约定、逐技能映射、必须替换的硬编码点。

## 通用替换表（所有技能适用）

| 源（openFuyao） | 目标（openAN） |
| ---- | ---- |
| `gitcode.com/openFuyao/...` | `github.com/project-openan/...` |
| GitCode MCP（`gitcode_*` 工具） | GitHub MCP（`github_*` 工具） |
| `GITCODE_TOKEN` | `GITHUB_TOKEN` / `GH_TOKEN` |
| 组织 `openFuyao` | `project-openan` |
| SIG | openAN 无 SIG 概念，改用「组件/仓库」维度；治理机构为 TSC |
| 看板（kanban） | GitHub Projects（或降级为 label，需显式声明） |
| 季度版本里程碑 | GitHub Milestone（语义不同，需显式声明降级） |
| `issue_severity` 属性 | GitHub label（如 `severity/major`） |
| Issue/PR 模板 | 沿用各仓库 `.github/` 模板，迁移时从 GitCode 模板改写为 GitHub 模板 |
| DCO | openAN 要求 DCO sign-off（`Signed-off-by`），PR 类技能需包含提示 |

## A. 平台协作类

**命名约定**：仓库 `skills/` 下不加前缀（如 `github-issue-creator`）；安装到本机技能目录（`~/.agents/skills/`）时加 `openan-` 前缀（如 `openan-github-issue-creator`）隔离同名技能。

**MCP 工具映射（gitcode-mcp → github-mcp，常用）**：

| gitcode-mcp | github-mcp |
| ---- | ---- |
| `gitcode_create_issue` | `create_issue`（labels 用字符串数组） |
| `gitcode_create_issue_comment` | `add_issue_comment` |
| `gitcode_get_issue` / 列表 | `get_issue` / `search_issues` |
| PR 创建/更新 | `create_pull_request` / `update_pull_request` |
| PR 读取与 diff | `get_pull_request` / `get_pull_request_diff` |
| PR 评论 | `add_issue_comment`（GitHub PR 即 issue 编号空间） |

**逐技能要点**：

| 源技能 | 适配要点 |
| ---- | ---- |
| `gitcode-issue-creator` | 属性配置流程（类型/优先级/看板/里程碑）中，看板与里程碑降级为 labels 或删除，需显式写出降级决策；`.issue.draft.md` 机制保留；Defect 模板换 GitHub 模板 |
| `gitcode-issue-fixer` | 读 Issue（含评论）→ GitHub MCP；修复后 PR 流程交 `github-pr-review`；评论回写前仍需用户授权 |
| `gitcode-pr-manager` | `.pr.draft.md` 机制保留；push/分支操作本地完成不变 |
| `gitcode-pr-review` | 基线对照逻辑不变；评审结论评论到 PR（GitHub  review comment / 普通评论） |
| `gitcode-pr-gate-diagnoser` | 门禁项从 GitCode「检查页」→ GitHub Checks API / Actions 运行日志；`/retest` 评论改为 re-run failed workflows（需防循环条件保留） |
| `gitcode-pr-changie` | changie 本身平台无关；PR 读取与回推改用 GitHub MCP |
| `gitcode-pr-codecheck` | CodeCheck 是 GitCode 专属门禁 → 改为解析 GitHub Actions 中静态检查 job 日志；或标记不迁移 |
| `cve-fixer` | CVE Issue 读取与评论换 GitHub MCP；依赖升级与 PR 流程同 `github-pr-manager` |
| `gitcode-issue-dispatcher` | webhook 载荷结构从 GitCode 改为 GitHub `issues.opened` 事件格式 |
| `e2e-bug-issue-creator` | 里程碑/看板推荐逻辑删除或降级；其余同 `github-issue-creator` |

## B. 测试用例生成类

**CSV 模板**：14 列 → openan 12 列模板。三个新增列（openan 模板已含）：

| 列 | 说明 |
| ---- | ---- |
| `language_profile` | 目标语言/框架 profile，供 e2e-test-code-gen 直接消费（如 `python/pytest`、`java/junit5`、`js/vitest`、`shell/bats`） |
| `component_deps` | 该用例涉及的组件依赖（引用 project-map 的仓库名） |
| `protocol_primitive` | 涉及的 A2A-T 协议原语（Task-T / Negotiation-T / Notification-T / Authorization-T），非协议用例留空 |

**逐技能要点**：

| 源技能 | 适配要点 |
| ---- | ---- |
| `feature-level-test-cases-gen` | 输入文档中的 GitCode 链接换 GitHub；输出 CSV 改 12 列模板 |
| `dfx-test-cases-gen` | 同上；DFT/DFD/DFS 等维度保留 |
| `test-cases-reviewer` | checklist 中 CSV 列校验改为 12 列 + 三新列合规检查 |
| `test-cases-generator` | 编排逻辑不变，子技能名同步替换 |

## C. E2E 测试执行类

**命名约定**：同 A 节——仓库 `skills/` 下不加前缀；本机安装时加 `openan-` 前缀。

**语言/框架矩阵（替换所有 Ginkgo 假设）**：

| 目标仓库 | 框架 | 运行命令形态 |
| ---- | ---- | ---- |
| Python 仓库（各 sdk、各 center 后端、knowledge-service） | pytest | `python -m pytest -q` |
| Java SDK 仓库（a2a-t/workflow-engine/observability-sdk-java） | JUnit 5 + Maven | `mvn test` |
| JS/TS 仓库（observability-sdk-ts 及各前端） | Vitest（+ Playwright 做页面 e2e） | `npx vitest run` / `npx playwright test` |
| `openan-installation` | Bats-core + ShellCheck；部署验证用 Kind | `bats tests/` |

**逐技能要点**：

| 源技能 | 适配要点 |
| ---- | ---- |
| `e2e-test-code-gen` | 生成目标从 `e2e/<feature>/`（Ginkgo）改为按语言矩阵输出：Python pytest → 目标仓 `tests/`；Java → 对应 Maven 测试目录；JS → 目标仓 tests/；Shell → bats 文件；`tests/README.md` 架构规划保留 |
| `e2e-test-runner` | 「预检-准备-测试-清理」四阶段保留；SSH 到测试虚机跑 Ginkgo 的路径删除，改为本地/容器执行 pytest；失败产物硬门槛不变（用例标识、证据路径、源码路径） |
| `e2e-test-regression` | 修复对象从 Ginkgo/Playwright 测试代码扩为 pytest/JUnit5/Vitest/Bats 测试代码；分支策略 `e2e-fix/<run_id>` 保留 |
| `e2e-failure-analyzer` | 根因分类枚举保留；证据解析支持 JUnit XML / Playwright report / pytest 日志；Allure 相关解析逻辑删除或改造 |
| `e2e-issue-retest` | 回写对象换 GitHub Issue；runner 命令换 pytest/JUnit5 |
| `e2e-issue-verifier` | 双路径验证（Playwright 本地 / Ginkgo SSH）改为 Playwright 本地 / pytest 本地或容器 |
| `e2e-failure-cluster-board` | 输入从 Allure 3 报告 URL 改为 JUnit XML / Playwright report / GitHub Actions 产物；聚类与建议逻辑保留 |

## D. 研发流程类

**总体策略**：语言无关、逻辑保留，替换社区术语、链接与产物命名。

| 源技能 | 适配要点 |
| ---- | ---- |
| `requirement-decomposition` | IR→SR→AR 拆解逻辑保留；输出文档中社区链接与术语替换 |
| `solution-design` | 4+1 视图、DFX、Story 设计保留；oFEP 相关引用见下行决策 |
| `ofep-converter` | **OFEP 是 openFuyao 专属概念**。openAN 无 OFEP，需显式决策：① 改造为通用 enhancement proposal 生成器（输出 GitHub issue/discussion 格式）；或② 标记不迁移。迁移 agent 不得静默保留 OFEP 命名 |
| `ofep-index-builder` | 同理：改造为扫描 GitHub issues/PR 的提案索引，或标记不迁移 |
| `design-reviewer` | 评审维度保留；安全维度同级保留 |
| `design2code` | 双 Agent + 人在回路 + PR 流程保留；PR 创建交 `github-pr-manager` |

## E. 质量门禁类

| 源技能 | 适配要点 |
| ---- | ---- |
| `code-reviewer` / `doc-reviewer` | 语言无关，仅替换平台引用与社区链接 |
| `repo-insight` | Git 历史/PR/Issue 分析逻辑保留；数据源从 GitCode 换 GitHub |
| `skill-governor` | 治理对象改为 openAN-powers 的 skills；评分维度保留 |
| `openapi-doc-check` | 校验工具链（openapi-spec-validator/spectral/oasdiff）平台无关；基线从「远端仓库最新版本」改为 GitHub raw 链接获取 |
| `code-doc-consistency-check` | 源场景为 go-restful 文档生成；openAN 无 Go 仓库 → 默认标记**不迁移**或通用化（需显式决策） |

## F. CI 流水线类

| 源技能 | 适配要点 |
| ---- | ---- |
| `pipeline-issue-reviewer` | 环境变量从 GitCode CI 注入格式改为 GitHub Actions（`$GITHUB_*`）；输出 review 文件机制保留；不直接交互平台的约束保留 |
| `pipeline-pr-gate-diagnoser` | 检查项日志来源从 GitCode ci 工具改为 GitHub Actions job 日志（UT/build/静态检查/SCA）；ci retry 改为 re-run failed workflows |

## 降级/不迁移决策记录要求

凡属以下情况，必须在迁移清单的「备注」列写明理由：

1. 平台专属能力无 GitHub 等价物（看板、CodeCheck、`/retest` 评论等）
2. 源场景在 openAN 不存在（go-restful 文档一致性、OFEP）
3. 主动裁剪的能力（如 SSH 虚机执行路径）
