---
name: github-pr-manager
description: 通过 GitHub MCP 为 project-openan 组织仓库创建、同步和维护 Pull Request。用户要求创建/提交 PR、推分支开 PR，或后续提交后需要更新已有 PR 标题与正文时使用。创建或同步前将正文写入工作区 .pr.draft.md，用户可手动修改，确认后再按文件文本提交。
---

# GitHub PR 创建与同步

在本地分支已 commit 并 push 到 fork 后，通过 GitHub MCP 向 upstream 创建 PR；若同一 `head` / `base` 已存在 open PR，则同步该 PR 的标题和正文。

> **技能名说明**：本仓库内 skill 相互引用使用仓库目录名（不带前缀）；安装到 Agent 环境后可能带 `openan-` 前缀（如 `openan-github-pr-manager`），以实际安装的 `SKILL.md` 的 `name` 为准。

标题、Commit、正文的格式与自查项见 [`templates/pr-template.md`](templates/pr-template.md)；本文件只约定执行流程与 MCP 参数。

## 前置条件

- 当前工作区是 git 仓库，且维护两个 remote：
  - `origin` — 个人 fork（推送源分支）
  - `upstream` — 主仓（PR 目标仓库）
- GitHub MCP 已启用（`.mcp.json` 的 `github-mcp`）；**调用 MCP 前**先读取工具 schema，勿凭猜测传参
- 环境已设置 `GITHUB_TOKEN`
- 待合并变更已 push 到 `origin` 对应分支

## Git 规约

1. 维护两个 git remote：`upstream`（project-openan 上游，PR 目标仓库）与 `origin`（当前用户的个人 fork，推送代码到此处）。
2. 确认 origin：用 GitHub MCP 验证 `origin` 指向的 fork 属于当前用户且 fork 自 upstream（可用 `search_repositories` 查询 `user:<登录名> fork:only`，或获取 fork 仓库信息核对 parent；登录名从 git 配置或用户处获取）。fork 名可与 upstream 仓库名不同；禁止直接用 `<user>/<repo>` 拼接。
3. 查不到该用户的 fork：阻塞并提示用户去 GitHub 创建 fork（也可通过 GitHub MCP `fork_repository` 创建后再继续）。
4. Fork + PR：不推 `upstream` 任何分支，也不在 `origin` 默认分支上开发；改动都走开发分支。
5. commit 使用 `git commit -s` 生成 DCO `Signed-off-by`（openAN 是 LFN 项目，硬性要求）；commit 的用户名与邮箱用当前用户的 GitHub 信息（git config 已配置为准，不一致时提示用户）。
6. 迭代重推（评审修改或打回后再推）：先把本开发分支相对目标基线的提交在本地 squash 成 1 个 commit，再 `git push --force-with-lease origin <开发分支>`。

## 工作流

| 阶段 | 说明 |
|------|------|
| 1 | 确认分支、base、目标仓库（owner/repo） |
| 2 | 本地冲突预检：fetch base 并 rebase；失败则退出 |
| 3 | 统计 commit 与变更范围，做 Commit 自检（含 DCO sign-off） |
| 4 | 检测同源 open PR → 创建或同步 |
| 5 | 按 `templates/pr-template.md` 组装 title / body，确定可选 MCP 参数 |
| 6 | 将正文写入 `.pr.draft.md`，对话展示拟提交内容并提示可手改或让 AI 改，等待确认 |
| 7 | 重新读取 `.pr.draft.md` 作为 body：创建走 `create_pull_request`，同步走 `update_pull_request` |
| 8 | 成功则删除 `.pr.draft.md` 并返回 PR 链接；按需由调用方触发 `github-pr-review` |

### 1. 确认 PR 上下文

从用户输入或当前仓库推断：

- `upstream_owner` / `upstream_repo` — PR 目标（通常来自 `git remote get-url upstream`）
- `fork_owner` / `fork_repo` — 个人 fork，须按「Git 规约」第 2 条经 GitHub MCP 验证；`origin` 与验证结果不一致时提示用户更正 remote，查不到 fork 时按第 3 条阻塞
- `head` — 已 push 的源分支名。**跨仓**（`fork_owner/repo` ≠ `upstream_owner/repo`）须用 `fork_owner:branch`
- `base` — 目标分支（默认主分支；用户指定优先）

### 2. 本地冲突预检（rebase onto base）

在组装 PR、调用 MCP **之前**，先确认当前分支相对 `upstream/<base>` 可干净 rebase。工作区须干净（无未提交变更）；若不干净，先提示用户处理，**不得**强行 rebase。

```bash
git fetch upstream
git rebase upstream/<base>
```

| 结果 | 处理 |
|------|------|
| **成功** | 若 rebase 改写了历史，执行 `git push --force-with-lease origin <源分支>` 后再继续后续阶段；未改写则可跳过 push |
| **冲突或其他失败** | 立即 `git rebase --abort`，**退出本 skill 流程**，向用户说明冲突文件/原因，并提示自行解决冲突、完成 rebase 与 push 后重新调用本 skill |

冲突退出时须明确告知：本 skill **不会**继续创建/同步 PR，也 **不会**自动解决冲突。

### 3. 统计 commit 与变更范围

```bash
git rev-list --count upstream/<base>..HEAD
git log --oneline upstream/<base>..HEAD
git diff --stat upstream/<base>..HEAD
git diff --name-only upstream/<base>..HEAD
```

- **Commit 自检**（按 `templates/pr-template.md`「Commit 与 squash message」校验范围内全部 commit）：英文 Conventional Commits 单行；**每个 commit 均含 DCO `Signed-off-by` 尾注**（`git log --format='%B' upstream/<base>..HEAD` 抽查）。不合规则在 §6 标未通过、列出问题 commit，并提示先改写/rebase；仅用户明确豁免才可继续
- **多 commit**：GitHub 在 PR 创建时不传 squash 参数（squash 在合并时由 maintainer 选择合并策略）；多 commit 时确保每个 commit 自身规范，并在对话中建议「合并时选择 Squash and merge」，首行消息与 PR 标题对齐
- 展示 commit 列表、diff stat、变更文件，请用户确认单一职责（一个 PR 只解决一个问题/功能）

### 4. 检测已有 PR

1. 用户提供 `pull_number` → `mcp__github-mcp__get_pull_request` → 同步模式
2. 否则 `mcp__github-mcp__list_pull_requests` 查 open PR，匹配同一 `head` / `base`：
   - 同仓：`head == <branch>` 且 `base == <base>`
   - 跨仓：`head == <fork_owner>:<branch>`，或详情中源仓库/源分支一致
3. 唯一匹配 → 同步；多个候选 → 请用户选择；无匹配 → 创建
4. 同步模式须读取现有 `title`、`body`、`pull_number`、URL

### 5. 组装内容与可选参数

1. 读取 [`templates/pr-template.md`](templates/pr-template.md)，组装并校验 `title`、`body`
2. 缺 Issue / 测试 / 发布说明等必填信息时先请用户补齐；仅明确豁免可继续
3. Issue 关联写在正文中：同仓用完整 URL `https://github.com/<owner>/<repo>/issues/<number>`（需要合并后自动关闭时才用 closing keyword `Closes #N`）；跨仓只能写完整 URL
4. GitHub 无 `prune_source_branch` 参数：源分支合并后是否删除由仓库 Settings 的 auto-delete head branches 决定，向用户说明即可

**同步正文策略**（创建模式不适用）：

- 结构符合模板必填章节 → 可整段按模板重生成，展示时说明将整段更新
- 含明显人工补充（模板外章节、Reviewer 备注等）→ 先出草案，确认后再覆盖或手动合并
- 不得静默覆盖非模板内容
- 「人工复核声明」已勾选项：本轮有代码变更则全部改回 `[ ]`；仅修改 PR 描述则可保留 `[x]`

### 6. 写入草稿并确认

**不得**在未获用户确认前调用 create/update。

组装完成后，将拟提交的 **body** 原样写入**当前工作区根目录** `.pr.draft.md`（`./.pr.draft.md`）。文件已存在则覆盖。文件内容**仅含正文**，不含 title 或可选 PR 属性。

写入后，对话中**必须展示拟提交内容**，至少包括：

- 草稿路径：工作区根目录 `.pr.draft.md`
- 目标 `owner/repo`、`head` → `base`、操作模式（创建/同步）
- §2 预检结果（已 rebase 成功 / 已 force-with-lease 推送）
- commit 数与列表、diff stat、变更文件
- 同步时：现有 `pull_number`、URL、当前 title，以及将按草稿覆盖正文的说明
- **title**（单行，在对话中确认，不写入草稿）
- **完整 body**（与 `.pr.draft.md` 当前内容一致）
- `templates/pr-template.md` 自查清单结果（含 DCO sign-off 检查）

并明确提示用户可选：

1. 直接确认提交
2. 在 `.pr.draft.md` 路径手动修改正文后回复确认
3. 在对话中说明修改要求，由 AI 改 `.pr.draft.md` 后再次展示拟提交内容

用户确认后进入 §7。用户要求 AI 修改或已手改文件时，先更新/重读 `.pr.draft.md`，再展示拟提交内容并等待确认。其它 skill 委托本 skill 时，仍须完成本节（含写入 `.pr.draft.md`），调用方勿跳过直接调 MCP。

### 7. 按草稿创建或同步 PR

用户确认后，**必须重新读取**工作区根目录 `.pr.draft.md`，以其全部内容作为 MCP `body`，不得使用内存中的初稿。文件不存在或为空：**停止**，不得调用 create/update。

`title`、`owner`、`repo`、`head`、`base` 等仍用 §1～§5 已确认的值。

创建模式：

```
CallMcpTool: github-mcp / create_pull_request
  {
    owner: <upstream_owner>,
    repo: <upstream_repo>,
    title: <§5 组装并经对话确认的标题>,
    head: <源分支名>（跨仓时使用 `fork_owner:branch` 格式）,
    base: <目标分支>,
    body: <来自 .pr.draft.md 全文>
  }
```

同步模式：

```
CallMcpTool: github-mcp / update_pull_request
  {
    owner: <upstream_owner>,
    repo: <upstream_repo>,
    pull_number: <existing_pull_number>,
    title: <§5 组装并经对话确认的标题>,
    body: <来自 .pr.draft.md 全文>
  }
```

参数名与可选项以 MCP descriptor 为准。

### 8. 收尾

- 创建/同步**成功后删除** `.pr.draft.md`；失败或未调用 MCP 则保留，便于改稿重试
- **不得** `git add` / commit `.pr.draft.md`
- 返回 PR URL、`pull_number`；同步时附更新摘要
- 默认不自动评审；调用方需要时再触发 `github-pr-review`

---

## 被其他 Skill 调用

其它 skill 在 **commit 已 push** 后调用本 skill，只传场景个性化字段；冲突预检、统计、检测、squash、模板校验、写入 `.pr.draft.md`、确认与 MCP 调用由本 skill 统一执行。

```
Skill: github-pr-manager
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 见 `templates/pr-template.md` 标题规范 |
| `head` | 是 | origin 源分支；跨仓用 `fork_owner:branch` |
| `base` | 是 | 目标分支 |
| `body` | 是 | 见 `templates/pr-template.md`；可按场景预填 |
| `pull_number` | 否 | 已知则直接同步 |

**返回**：PR URL、`pull_number`、模式（created/updated）；§2 冲突失败或其它错误时返回错误信息。

## AI 使用边界

本 skill 可由 AI Agent 执行，写操作须可审计。边界如下。

| 类别 | 操作 | 执行方 |
|------|------|--------|
| AI 可自动做 | 解析 remote / 分支、`fetch`、冲突预检 rebase、统计 commit 与 diff、检测已有 open PR、按 `pr-template.md` **起草** title/body、写入 `.pr.draft.md`、在对话中展示拟提交内容 | Agent |
| 必须人工确认后 Agent 才可做 | 重新读取 `.pr.draft.md` 后调用 `create_pull_request` / `update_pull_request`；在正文写入 closing keyword（`Closes #N`）；rebase 改写历史后的 `push --force-with-lease`（若用户未在本轮预先授权） | 用户确认 → Agent 执行 |
| 仅人工 | 勾选 PR 正文「人工复核声明」、决定是否合入、合并 PR、对合入结果负责 | 人（贡献者 / Reviewer / Maintainer） |
| 禁止 | 未确认即 create/update；确认后不重读 `.pr.draft.md` 而用内存初稿；只展示草稿路径却不展示拟提交内容；将「人工复核声明」预勾选为 `[x]`；在声明中声称「AI 已完成人工评审 / AI 已合入」；在 AI 使用声明中写入本 skill 名，或把「PR 标题/正文组装」列入参与环节 | — |

`AI 使用声明`、`人工复核声明` 的填写与省略规则见 `pr-template.md`。填写「人工复核声明」时写入未勾选 checklist，**不得**代替人勾选。
