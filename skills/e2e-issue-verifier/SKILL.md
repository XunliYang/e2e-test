---
name: e2e-issue-verifier
description: 面向全栈 e2e 失败分析、最小化验证、产物/日志证据判断与 Issue/PR 闭环结论的专用 Skill。支持前端 Playwright（本地工作区）与后端按语言 profile（Python pytest / Java JUnit5 / Shell bats，本地或 SSH 测试环境）双路径验证。聚焦失败用例提取、源码与环境状态联合定位，不承担通用代码修复主流程。若验证结论表明需要改代码，交还给 github-issue-fixer；若需要新建 Issue，交还给 github-issue-creator。
---

# E2E Issue Verifier

本 Skill 的目标是把 e2e 失败的**真实页面/服务状态、根因、验证结论和交接建议**分析清楚。

它负责：
- 收集失败证据
- 生成最小验证命令
- 结合源码与环境真实状态定位根因
- 判断是否真的修复
- 输出可回填 Issue / PR 的结论草稿

它不负责：
- 通用问题修复主流程
- commit / push / PR 创建 / PR review

若分析结果表明需要修复代码或提 PR，应交还给 `github-issue-fixer`。
若需要新建问题单，应交还给 `github-issue-creator`。

## 1. 前置条件

### 1.1 输入要求

以下输入满足其一即可开始：

- 失败日志、报错截图、trace 或 report JSON
- 失败位置文件路径与行号
- GitHub Issue / PR URL 或编号
- 用户已执行完验证并贴出结果

**输入门禁 (阶段 1 拦截)：**

- **信息不足：** 如果仅提供“测试挂了”，必须先停止并要求用户补充测试命令、报错日志或 Issue 链接。
- **后端特殊要求：** 若验证需在远程测试环境执行（如 bats 安装场景需要真实虚机），必须明确提供 SSH 连接信息（IP、用户名、密码/密钥）以及目标项目的工作目录；本地可执行的 pytest / Maven 用例不得要求 SSH。不得凭空猜测。

### 1.2 仓库与验证前提

- 必须能唯一确定目标 Git 仓库 (`owner/repo`)。
- **前端验证：** 当前本地工作区可访问目标 e2e 项目（如 `openan-portal`），且没有未提交的阻塞改动。
- **后端验证：** 本地工具链通过 `e2e-test-runner` 预检（Python `uv` / Java JDK17+ 与 Maven / Shell bats 等），或给定的 SSH 凭证可连通且远程环境就绪。

## 2. 工作流 (TodoWrite 跟踪)

使用 TodoWrite 跟踪以下阶段进度，每完成一步立即标记。

| 阶段 | 名称             | 说明                                                         |
| ---- | ---------------- | ------------------------------------------------------------ |
| 1    | 识别与解析输入   | 区分前端/后端测试与语言 profile；提取报错或 Issue 链接；**不足则触发门禁**。 |
| 2    | 读取上下文       | 通过 GitHub MCP 拉取 Issue 详情与**评论列表**。                     |
| 3    | 提取与聚类证据   | 提取日志、trace、截图；多个失败用例进行聚类。                |
| 4    | 生成最小验证命令 | 确定单用例/文件级重跑命令（Playwright 或按语言 profile 的后端命令）。 |
| 5    | 环境运行与观测   | 本地执行（前端/后端本地用例）或 SSH 远程执行；结合源码与环境状态定位。 |
| 6    | 根因判定与报告   | 输出修复状态、根因分类和 FixContext 结论。                   |
| 7    | Issue / PR 回填  | 将分析结论或验证结论回填到 Issue 评论或 PR 评论。             |
| 8    | 用户授权与交接   | **经用户明确授权后**，调用其他 Skill 进行代码修复或建单。    |

## 3. 验证执行路径 (双轨制)

### 3.1 前端 Playwright 验证路径 (本地工作区)

1. **工作目录：** 执行前端最小验证命令前，必须先 `cd` 到前端 e2e 项目目录（如 `e2e-frontend/` 或 `openan-portal`），再运行 Playwright 命令。
2. **最小命令生成：** 优先使用失败用例名配合 `-g`。
   `npx playwright test path/to/spec.ts -g "failed case name" --project=application`
3. **命令优先级：** 如果用户已经明确提供了可执行的 Playwright 命令或 spec 路径，应直接使用用户命令作为最小验证命令；不得因为自动识别不到 `package.json`、`playwright.config.ts` 或入口目录而中止。
4. **正则转义：** 若用例名含正则特殊字符，必须转义，或改用稳定关键词。
5. **环境与产物：** 检查 `.env.test`；优先利用 `playwright-report`、`test-results`、`trace.zip`、screenshot、video、`error-context.md` 缩小范围，而非盲目重跑。

### 3.2 后端验证路径 (按语言 profile 分发)

后端用例**默认本地执行**（复用 `e2e-test-runner` 的预检与准备约定）；仅当用例本身要求真实安装环境（如 `openan-installation` 的 bats 场景）且用户提供 SSH 信息时才远程执行。

1. **工作目录：** 进入目标测试包目录（含 `pyproject.toml` / `pom.xml` / `tests/` 的目录），与 `skills/e2e-test-code-gen/references/<lang>.md` 中的运行命令节保持一致，禁止跨语言套用命令格式。
2. **环境检查：** 确认依赖已安装（Python `uv sync` / Java 依赖已解析 / bats 可执行），检查 `.env` 已按 `env.example` 正确配置。
3. **最小命令生成（按语言）：**

| 语言 | 最小验证命令示例 |
| --- | --- |
| Python | `uv run pytest tests/integration/test_agent_register.py::test_register_agent_success -q` 或 `-k "FIT-registry-center-agentcard-001"` |
| Java | `mvn test -Dtest=AgentRegisterIT#registerAgentSuccess` |
| Shell | `bats tests/install/agent_register.bats --filter "agent register success"` |

4. **命令优先级：** 如果用户已经明确提供了可执行命令或用例路径，应直接使用用户命令作为最小验证命令；不得因为自动识别不到构建文件或包入口而中止。
5. **结果捕获：** 在 Shell 中执行命令，捕获 stdout/stderr 作为证据。需要 SSH 远程执行时，全程在远程 shell 中运行，严禁把远程用例拿到本地直接跑。
6. **多组件联调：** 用例依赖多个服务（如 registry-center ↔ orchestration-center）时，优先使用仓库自带 `docker-compose.yml` 编排，启动后做健康检查；失败时标注卡在哪个组件的启动。

### 3.3 验证范围扩展原则

- 最小验证是必做项，用于确认原始失败点是否修复。
- 若修复涉及公共 helper、page object、conftest/fixture、工具函数、共享 locator 或共享测试数据，应继续执行文件验证。
- 若修复可能影响同模块其他场景，应进一步追加同模块回归。
- 若前一层验证已发现新增失败，应先回到代码修复，不必继续扩大范围。
- 验证顺序为：单项 e2e -> 文件验证 -> 同模块回归 -> trace/report 检查。

## 4. 失败信息提取

### 4.1 Issue 上下文拉取规范

如果是 GitHub Issue，先用 GitHub MCP 拉取正文，**必须紧接着调用评论列表工具**（工具名以 MCP descriptor 为准；服务未暴露评论列表时如实告知并仅以正文继续）。将正文与评论线程合并，提取隐藏的复现环境或前人排查日志。

### 4.2 要素提取

- **通用：** 框架、命令、失败用例名、源码路径、行号。
- **前端特有：** locator、DOM 错误、超时、traceId。
- **后端特有：** Python traceback / Java 异常堆栈 / shell 断言 diff、docker 容器未就绪、compose 编排报错、服务健康检查超时。

## 5. 源码与环境真实状态联合定位

### 5.1 源码读取

支持读取 spec/test 文件、page object / conftest / framework 工具包、测试数据及配置文件。

### 5.2 状态判定原则 (依赖外部知识库)

- **前端排查：** 先判断隐藏实例、旧弹层残留、零尺寸节点，再判断错误容器、同名节点歧义、虚拟列表可视窗口、瞬态遮挡与动画未完结；若 trace 显示未进入可见 DOM，判定为“交互不完整”。
- **后端排查：** 先区分是测试代码断言失败，还是环境/编排问题（docker 容器退出、compose 服务未就绪、依赖安装失败）；再区分语言层面的结构性失败（pytest collection error、Java 编译失败、bats 语法错误）。

> 💡 **必须主动检索并严格参考：** 前端问题检索 `references/frontend-e2e-knowledge.md`；后端问题检索 `references/backend-e2e-knowledge.md`。

## 6. 失败用例聚类

存在多个失败时，优先按以下特征聚类：相同报错摘要、相同 spec/包路径、相同定位器、相同 traceback / 异常堆栈。

## 7. 根因分类

输出置信度及依据（与 `e2e-failure-analyzer` 的分类对齐）：

- **测试代码缺陷 (E2E_CODE_BUG)：** Locator 错误、等待不合理（前端）；fixture/teardown 不彻底污染下个用例、断言过严（后端）。
- **被测系统缺陷 (SOURCE_BUG)：** UI 交互 Bug；后端 API 报错、服务启动失败。
- **环境/依赖问题 (ENV_INFRA)：** 网络不通、docker/compose 环境异常、依赖版本不匹配、CI 差异。
- **Flaky/时序问题 (FLAKY_TIMING)：** 前端动画竞态；后端服务最终一致性等待不足。

## 8. 修复状态判断

输出状态：已修复 / 未修复 / 部分修复 / 无法复现 / 验证受阻。
**Flaky 兜底规则：** 若单次验证通过但报告显示失败，不得直接判定已修复。建议增加 `--repeat-each=3` (前端 Playwright)、`--count=3`（pytest-repeat）或重复执行 bats 验证稳定性。不得仅凭 PR 合入或吞掉异常判定修复。

## 9. 结论交接与 Skill 协同规则

### 9.1 交接前授权门禁

当 FixContext 已完整且根因明确时，必须先输出完整结论和可交接的 FixContext 建议，并**询问用户是否同意交接**。**获得明确同意后方可执行调用。**

若用户已明确表示“继续”“确认”“交接”或等价授权，则不得继续停留在分析层面，应立即进入对应 Skill 的调用准备。

若该次任务已经确认需要回填 Issue / PR，也应在授权后执行回填，并在输出中明确记录回填结果。

### 9.2 呼叫 github-issue-fixer 契约

获得授权后调用 `github-issue-fixer`。参数需包含 `FixContext`。若用户已要求“直接交接”“继续修复”或提供了完整 FixContext，应优先执行交接流程，不得重复空转分析：

```json
{
  "target_file": "path/to/file",
  "line_number": 105,
  "action_required": "UPDATE_LOCATOR | FIX_TEARDOWN | FIX_ASSERTION | INCREASE_POLL_TIMEOUT",
  "suggested_code": "建议的具体代码/定位器字符串",
  "wrong_code_found": "引发失败的原始代码",
  "error_snapshot": "DOM隐藏状态 或 容器退出日志",
  "recommended_test_cmd": "重跑该用例的具体命令"
}
```

### 9.3 呼叫 github-issue-creator 契约

若是真切的业务 Bug，经授权后呼叫 `github-issue-creator`，传入：复现命令、Trace/日志证据、预期与实际结果。

### 9.4 回填 Issue / PR 契约

若当前任务已确认需要回填 Issue 或 PR，且用户已明确授权，则应将以下内容写回目标 Issue/PR（GitHub MCP 评论工具，以 descriptor 为准）：
- 根因摘要
- 最小验证命令
- 验证结果
- 修复状态
- 是否建议关闭 Issue

回填时应优先使用已有的 Issue 评论线程或 PR 评论线程，不得在未授权时擅自写回。

## 10. 输出格式

每次结束必须输出以下信息（字段顺序固定）：

- 当前阶段：分析中 / 待交接 / 回填已执行 / 交接已执行 / 待验证 / 验证中 / 已验证

### 处理结论

- 入口类型：前端本地验证 / 后端本地验证 / 后端 SSH 验证 / Issue / PR
- 目标仓库：
- 语言 profile（后端）：
- 关联 Issue / PR：
- 根因分类与修复状态：

### 失败信息摘要

- 测试框架及命令：
- 失败用例及文件：
- 错误摘要：
- 关键要素 (Locator / 容器或服务状态)：

### 已执行操作

- Issue 查询 / 读取 / 评论读取：是/否
- SSH 远程调用 / 依赖检查：是/否
- 本地验证 / 源码分析：是/否

### 验证结果

| 步骤 | 命令/操作 | 结果 |
| --- | --- | --- |
| 单项 e2e | ... | 通过/失败/未执行 |
| 文件验证 | ... | 通过/失败/未执行 |
| 同模块回归 | ... | 通过/失败/未执行 |
| trace/report 检查 | ... | 通过/失败/未执行 |
