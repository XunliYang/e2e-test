---
name: github-pr-review
description: 通过 GitHub MCP 拉取 PR 信息，在本地对照 upstream 基线审阅差异，生成评审报告与合入清单，再把结构化结论评论到 PR。用户要求评审 GitHub PR、做代码审阅，或提供 PR 链接/编号需要发表意见时使用。
---

# GitHub PR 评审

在 **不修改 PR 代码** 的前提下：获取 PR 信息 → 拉取 PR 分支并获取代码变更 → 生成 PR 合入 checklist → 使用 `code-reviewer` skill 评审变更 → 用 MCP 提交评论 → 删除本地临时 PR 分支。

> **技能名说明**：本仓库内 skill 相互引用使用仓库目录名（不带前缀）；安装到 Agent 环境后可能带 `openan-` 前缀（如 `openan-github-pr-review`、`openan-code-reviewer`），以实际安装的 `SKILL.md` 的 `name` 为准。

## 前置条件

- GitHub MCP 已启用（`.mcp.json` 的 `github-mcp`）；**调用任何 MCP 工具前**先读取该工具在 MCP 描述符中的 schema（参数名、必填项、评论类型等），勿凭猜测传参。
- `code-reviewer` skill 可用（openan-powers 技能集）；不可用时停止评审并提示，不要在本技能内复制一套评审规则继续审。
- 当前工作区是一个 git 仓库，且维护两个 remote：
  - origin — 个人 fork 的仓库（推送代码到此处）
  - upstream — 主仓库（PR 目标仓库，也是 Issue 通常所在的仓库）
- 环境已设置 `GITHUB_TOKEN`

## 解析用户输入的 PR

用户可能提供：

| 形式 | 示例 |
|------|------|
| 完整 URL | `https://github.com/owner/repo/pull/42` |
| owner/repo + ID | `owner/repo#42` |
| 仅 ID | `#42` / `PR 42`（从 `upstream` URL 推断 owner/repo） |

提取 **标题`title`**、**简介`body`** 关键信息。

## 工作流

### 1. 获取 PR 信息

调用 MCP（`github-mcp`）：

```
mcp__github-mcp__get_pull_request
```

传入 schema 要求的 owner/repo 与 PR 编号等。从返回中读取：**标题、描述、源分支、目标分支、head、base、作者、状态、合并策略配置、已有讨论要点**等，用于「PR 总览」与本地 diff。

### 2. 拉取 PR 分支并获取代码变更

第 1 步 PR 信息中应包含 PR 的 `head` 与 `base` 信息。先确认 PR base，再拉取 PR head 到本地临时分支，最后在本地对比 base 与 PR。

1. 确认并准备 PR base

从 MCP 返回中读取 PR 的 base 分支或 base commit：

- 如果 base 是 `master` / `main`，更新对应的 upstream 跟踪分支：

```bash
git fetch upstream <base_branch>
```

此时本地对比基线为 `upstream/<base_branch>`。

- 如果 base 是特性分支或版本分支，拉取该 base 分支到本地临时基线分支：

```bash
git fetch upstream "<base_branch>:pr_<ID>_base"
```

此时本地对比基线为 `pr_<ID>_base`。

2. 拉取 PR 头指针到本地临时分支

GitHub 使用 `refs/pull/<ID>/head` refspec：

```bash
git fetch upstream "+refs/pull/<ID>/head:pr_<ID>"
```

拉取后校验本地 PR 分支与 PR 信息中的 head 一致：

```bash
git rev-parse pr_<ID>
```

若 PR 信息提供了 `head` sha，上述结果应与其一致；不一致时，以本地 `pr_<ID>` 与 PR 信息不一致为异常处理，不继续基于错误 head 审阅。

3. 对比 base 与 PR

使用步骤 1 得到的本地 `base_ref` 与本地临时分支 `pr_<ID>` 生成变更内容：

```bash
git diff <base_ref>...pr_<ID>
git log --oneline <base_ref>..pr_<ID>
```

必要时查看关键文件以理解实现而非只看 diff 行面。**读取文件前必须先归一化路径**：

```bash
git rev-parse --show-toplevel
```

所有文件路径统一以上述输出（git 顶层目录）为基准。读取 PR head 文件内容时，**优先使用 `git show` 而非 `Read`**，避免读到工作树中其他分支的版本：

```bash
git show pr_<ID>:<相对于 git 根的路径>
```

仅在确认当前工作树就是 `pr_<ID>` 分支、且已 `git checkout pr_<ID>` 的情况下，才可用 `Read` 直接读取文件。

#### 2.4 生成 PR 合入 Checklist

在代码评审之外，**必须**根据 PR 元数据与 commit 历史生成合入 checklist，并在最终报告中单独呈现（见 §4）。

**判定规则**

1. **PR 已关联 Issue**
   - 检查 `get_pull_request` 返回中的关联 Issue 字段（字段名以 MCP schema 为准）；同时检查 PR 正文是否包含 closing keyword（`Closes` / `Fixes` / `Resolves` + `#<number>`）或完整 Issue URL
   - 已关联 → `[x]`；未关联 → `[ ]`，并在说明中提示应关联对应 Issue 或在正文中写明 Issue 链接

2. **PR 无需 squash / PR 包含多个 commit，已建议 squash 合并**
   - 统计 commit 数：`git rev-list --count <base_ref>..pr_<ID>`
   - **仅 1 个 commit**：勾选 `[x] PR 无需 squash`
   - **大于 1 个 commit**：GitHub 的 squash 在合并时由 maintainer 选择合并策略，检查 PR 正文/对话中是否已给出「Squash and merge」建议或 commit 整理说明：
     - 已给出 → `[x] PR 包含多个 commit，已建议 squash 合并`
     - 未给出 → `[ ] PR 包含多个 commit，已建议 squash 合并`，并说明当前 commit 数与缺失项

3. **commit 均含 DCO `Signed-off-by`**
   - 执行 `git log --format='%B%n---' <base_ref>..pr_<ID>`，检查每个 commit message 均含 `Signed-off-by:`
   - 全部含 → `[x]`；有缺失 → `[ ]`，并列出缺失的 commit（openAN 是 LFN 项目，DCO 为硬性要求）

**输出模板**（勾选状态按实际判定填写，勿默认全 `[x]`；squash 检查项根据 commit 数量展示二选一）：

```markdown
## PR 合入 Checklist

- [ ] PR 已关联 Issue
- [ ] PR 无需 squash / PR 包含多个 commit，已建议 squash 合并
- [ ] commit 均含 DCO Signed-off-by
```

#### 2.5 按规模分流

统计变更规模：

```bash
CHANGED_FILES=$(git diff --name-only <base_ref>...pr_<ID> | wc -l)
DIFF_LINES=$(git diff <base_ref>...pr_<ID> | wc -l)
```

- 若 **变更 ≤ 5 文件 且 diff ≤ 500 行** → 主流程直接加载 `code-reviewer` skill 评审，**跳过步骤 3**（不启动 subagent），评审完成后直接进入步骤 4
- 若超出上述阈值 → 进入步骤 3，启动 subagent 评审

### 3. 调用 code-reviewer Skill 进行评审（subagent 路径，仅大 PR）

在 subagent 的上下文内进行具体代码评审，调用前准备以下输入：

- PR 元数据：标题、描述、作者、源分支、目标分支、head、base、状态、已有讨论要点
- 基线信息：本地 `base_ref`、临时分支 `pr_<ID>`
- 变更概览：`git diff --name-only <base_ref>...pr_<ID>`
- commit 历史：`git log --oneline <base_ref>..pr_<ID>`
- 项目规范：如仓库存在 `AGENTS.md`，将其作为评审上下文提供
- 验证信息：PR 描述、CI 结果或用户提供的测试记录中能确认的验证内容

使用 Agent 工具启动一个临时评审 subagent，传入如下 prompt：

```markdown
你是代码评审执行 Agent。你的职责是根据调用方提供的 PR 变更上下文，加载并遵循 `code-reviewer`，生成规范代码评审报告。

工作要求：
1. 只基于调用方提供的 PR 元数据、base/head、本地 diff、commit 历史、项目规范和验证信息进行评审。
3. 不修改代码、不提交 commit。
4. 如果评审上下文不足，按 `code-reviewer` skill 的要求在报告中列出开放问题，不要臆测 PR 目标。
5. 严格输出 `code-reviewer` skill 要求的 Markdown 评审报告，不添加额外流程说明。

PR 信息：
- 标题：<title>
- 描述：<body>
- 作者：<author>
- 源分支：<source_branch>
- 目标分支：<base_branch>
- head：<head sha 或 head ref>
- base：<base sha 或 base ref>
- PR ID：<ID>

本地基线与分支：
- 基线：<base_ref>
- PR 临时分支：pr_<ID>

评审输入：
- 变更文件列表：
<git diff --name-only <base_ref>...pr_<ID>>

- Commit 历史：
<git log --oneline <base_ref>..pr_<ID>>

- 已知验证信息：
<CI、测试命令、PR 描述中的验证记录；没有则写”未提供”>

请在评审前自行获取变更详情：
- 先运行 `git rev-parse --show-toplevel` 获取 git 顶层目录，所有文件路径以此为基准
- 运行 `git diff <base_ref>...pr_<ID>` 获取完整变更
- 必要时用 `git show pr_<ID>:<相对于 git 根的路径>` 查看 PR head 真实文件内容，**不要用 Read** 读取文件（Read 读取的是当前工作树文件，可能与 PR 分支不一致）

请仅对本 PR 引入的变更做代码评审，并将报告作为最终输出返回主 Agent。
```

若无法启动评审子任务，或子任务无法加载 `code-reviewer` skill，停止评审并告知用户需要先修复执行环境或 skill 配置，不要在本技能内复制一套评审规则继续审。

### 4. 评审报告展示与评论

评审交付物包含两部分，**均须在对话中展示**：

1. **PR 合入 Checklist**（§2.4 生成）
2. **代码评审报告**（`code-reviewer` 输出）

发到 PR 时，Checklist 置于代码评审报告**之前**。

#### PR 评论门禁

评审报告与 Checklist **默认仅在对话中展示**。调用 MCP 评论须满足任一条件：

- 首次指令已写明发到 PR（如「review PR#42 并评论到 PR」「审阅 #42 发评审意见」）
- 后续对话中获取用户明确授权（如「发到 PR」「同意发评论」）

用户要求修改评审报告时，更新后再次展示，等待确认才可发布评论。

用户确认后，将 §2.4 生成的 **PR 合入 Checklist**（含实际 `[x]` / `[ ]` 状态）与 **代码评审报告** 合并为 PR 评论正文，在报告末尾追加 AI 生成信息：

```markdown
## 合入 Checklist

- [x] PR 已关联 Issue
- [ ] PR 无需 squash / PR 包含多个 commit，已建议 squash 合并
- [ ] commit 均含 DCO Signed-off-by

<内嵌评审子任务返回的完整格式化报告>

## AI 生成信息

| 项 | 值 |
|----|-----|
| 辅助工具 | 据实填写：如 Cursor、Claude、其他 |
| 模型 | 当前会话实际使用的模型名；系统未暴露则写「未知」 |

使用 [github-pr-review](https://github.com/project-openan/openan-powers/tree/main/skills/github-pr-review) skill 生成。

该评审结果仅供参考。
```

不要改写代码评审报告结构，不要扩展出内嵌评审子任务未指出的新问题。Checklist 勾选状态须与 §2.4 判定一致。只允许补充 AI 生成信息、生成来源与免责声明。

调用 MCP（工具名以 descriptor 为准）：

```
mcp__github-mcp__create_pull_request_review
```

传入 owner/repo、PR 编号、`event: "COMMENT"` 与 **完整评论正文**（上节模板渲染结果）；若工具支持 **行级评论** 且存在明确单点问题，可对最关键 1～2 处附加行评；否则 **一条总评** 即可，避免刷屏。若 `create_pull_request_review` 不可用或不支持纯评论，退回 `mcp__github-mcp__add_issue_comment`（GitHub 的 PR 也是 Issue）。

### 6. 收尾：删除本地 PR 分支

只要执行过 `git fetch upstream "+refs/pull/<ID>/head:pr_<ID>"`，**在本次评审任务全部结束后**（用户已确认发表评论，或明确放弃发表评论、流程终止），**必须**删除本地临时分支 `pr_<ID>`，避免长期残留。若为特性/版本 base 创建了 `pr_<ID>_base`，也一并删除。

```bash
# 若当前正位于 pr_<ID>，先切换到其它分支（如本地 main/master 或 upstream 跟踪分支的检出分支）
git switch -
# 或：git checkout <其它已有分支>

git branch -D pr_<ID>
git branch -D pr_<ID>_base
```

- 若 `branch -D` 报告分支不存在，说明未创建或已删过，无需报错。
- **不要**删除 `upstream` 上的 PR 源分支或 base 分支，仅删除本地 **`pr_<ID>`** 与必要时创建的 **`pr_<ID>_base`**。

**任务完全结束自检**：

- [ ] 已执行 `git branch -D pr_<ID>`；若创建过 `pr_<ID>_base`，也已删除（分支不存在则视为已清理）

## 异常处理

| 情况 | 处理 |
|------|------|
| 无 `upstream` | 提示用户添加 remote，并给出主仓 URL 占位说明 |
| `git fetch` ref 失败 | 检查 ID、权限、网络；GitHub PR fetch refspec 为 `refs/pull/<ID>/head` |
| MCP 返回与本地 diff 不一致 | 以本地 `pr_<ID>` 与已确认的 `base_ref` 为准写评审，并在总览中注明「与网页描述存在差异」若必要 |
| `git show pr_<ID>:<path>` 路径解析失败 | 排查路径是否以 git 根为基准、是否使用了正确文件名；反复失败则标记该文件为「上下文不足待确认」，**不要**对其下确定性问题结论 |
| 工作目录非 git 根目录 | 所有文件路径操作前先 `cd $(git rev-parse --show-toplevel)` 或显式拼接 git 根路径；严禁使用相对于当前工作目录的路径去 `Read` 文件 |
| PR head 分支已被删除或无法拉取 | 停止评审，告知用户当前无法获取 PR 代码，请求指导或等待修复；**不要**用本地工作树文件替代 PR head 内容 |
| 超大 PR | 总览中说明仅抽样审阅范围；表格列「已重点审阅的目录/主题」 |
| 无法删除 `pr_<ID>` | 当前 HEAD 仍在该分支时先 `git switch` 到其它分支；有未合并工作区改动时先 stash 或请用户处理，再删分支 |

## 与「改代码」类技能的区别

本技能 **默认只读**：不提交修复 commit、不推送分支。若用户同时要求修问题，先完成评审评论，再在单独任务中按修复工作流处理（如 `github-issue-fixer`）。
