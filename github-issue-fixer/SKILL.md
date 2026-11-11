---
name: github-issue-fixer
description: 通过 GitHub MCP 读取 Issue（含评论），在本地分析定位；先在对话里给出完整分析，经用户明确授权后再把同内容写回 Issue 评论；做最小化修复并验证后可提交并创建 PR，随后自动走 github-pr-review。用户说修复 issue、解决问题单、处理 GitHub issue 时使用。Issue 指向不清时先澄清，再拉取或查代码，禁止凭猜测开查。
---

# GitHub 问题单修复专家

自动化工作流：读取 GitHub Issue → 分析定位（**结论先对用户可见**）→ 经授权后再写 Issue 评论（默认）→ 最小变更修复 → 验证 → 按需提交 PR。

> **技能名说明**：本仓库内 skill 相互引用使用仓库目录名（不带前缀）；安装到 Agent 环境后可能带 `openan-` 前缀（如 `openan-github-issue-fixer`、`openan-github-pr-manager`、`openan-github-pr-review`），以实际安装的 `SKILL.md` 的 `name` 为准。

## 前置条件

- 当前工作区是一个 git 仓库
- GitHub MCP 服务已配置（提供 `get_issue`、Issue 评论列表、`add_issue_comment` 等工具；PR 创建/同步委托 `github-pr-manager`）；**调用 MCP 前**先读取工具 schema，勿凭猜测传参
- 环境已设置 `GITHUB_TOKEN`

## Git 规约

1. 维护两个 git remote：`upstream`（project-openan 上游，PR 目标仓库，也是 Issue 通常所在的仓库）与 `origin`（当前用户的个人 fork，推送代码到此处）。
2. 确认 origin：用 GitHub MCP 验证 `origin` 指向的 fork 属于当前用户且 fork 自 upstream（可用 `search_repositories` 查询 `user:<登录名> fork:only`，或获取 fork 仓库信息核对 parent；登录名从 git 配置或用户处获取）。fork 名可与 upstream 仓库名不同；禁止直接用 `<user>/<repo>` 拼接。
3. 查不到该用户的 fork：阻塞并提示用户去 GitHub 创建 fork（也可通过 GitHub MCP `fork_repository` 创建后再继续）。
4. Fork + PR：不推 `upstream` 任何分支，也不在 `origin` 默认分支上开发；改动都走开发分支。
5. commit 使用 `git commit -s` 生成 DCO `Signed-off-by`（openAN 是 LFN 项目，硬性要求）；commit 的用户名与邮箱用当前用户的 GitHub 信息（git config 已配置为准，不一致时提示用户）。
6. 迭代重推（评审修改或打回后再推）：先把本开发分支相对目标基线的提交在本地 squash 成 1 个 commit，再 `git push --force-with-lease origin <开发分支>`。

## 工作流

使用 TodoWrite 跟踪以下阶段进度，每完成一步立即标记。

| 阶段 | 名称 | 说明 |
|------|------|------|
| 1 | 解析 Issue 输入 | 从用户输入提取 owner/repo/issue_number；**不足则先请用户澄清，勿进入后续阶段** |
| 2 | 读取 Issue 详情 | 调用 MCP 获取 Issue 详情 + Issue 评论列表 |
| 3 | 分析定位 | 基于主仓代码搜索、阅读，做根因分析，在对话中给出完整结果；经用户明确授权后再发布 Issue 评论 |
| 4 | 最小化修复 | 只修改导致问题的代码，得到用户确认后执行 |
| 5 | 验证 | lint、构建、测试、问题复查 |
| 6 | 提交与创建 PR | 同步 upstream、创建分支、提交（含 DCO sign-off）、推送、创建 PR |
| 7 | PR 审核 | PR 创建后自动调用 github-pr-review 进行代码审核 |

### 阶段 1：解析 Issue 输入

用户可能以多种方式提供 Issue：

| 输入形式 | 示例 |
|----------|------|
| 完整 URL | `https://github.com/owner/repo/issues/42` |
| owner/repo#number | `project-openan/registry-center#42` |
| 仅编号（假定当前仓库） | `#42` 或 `42` |

**解析规则**：

1. 从输入中提取 `owner`、`repo`、`issue_number`
2. 若用户只给了编号，从 `git remote get-url upstream` 推断 owner/repo（Issue 通常属于主仓）
3. 注意：Issue 所属仓库可能与 upstream 不同，但 PR 始终提交到 upstream

**输入不足以继续时（阶段 1 门禁）**：

以下任一情况视为**尚不能开始**阶段 2（拉取 Issue）或阶段 3（代码探索），**必须先向用户说明缺失项并请其补充**，不得凭猜测选仓库、猜编号或直接进入 Grep/SemanticSearch 等探索：

- 无法唯一确定 `owner`、`repo`、`issue_number`（信息缺失、多义、或用户提供多个 Issue 但未指明处理哪一个）
- 用户叙述中根本没有可解析的 Issue 链接 / `owner/repo#号` / 明确的编号上下文
- 仅给了 `#号`/`编号`但 **`upstream` 不存在或无法解析**（见文末「remote 缺失处理」）；须先补齐 remote 或由用户给出完整 `owner/repo`
- 用户期望修复的对象与给定 Issue **明显对不上**，需先对齐范围

澄清时应列出具体问题（例如缺少仓库路径、要问的是哪一条 Issue、`upstream` 应指向哪里），必要时给出填写示例。**收到可解析、无歧义的输入后再进入阶段 2。**

### 阶段 2：读取 Issue 详情与评论

1. **Issue 正文**：调用 MCP 获取 Issue 详情（与解析得到的 `owner` / `repo` / `issue_number` 一致）：

```
CallMcpTool: github-mcp / get_issue
  { owner, repo, issue_number }
```

2. **Issue 评论**：在获取详情后，**紧接着**调用评论列表接口，拉取该 Issue 下已有评论（若有），避免遗漏参与者补充的复现步骤、环境信息或前人分析。评论列表工具名以 MCP descriptor 为准（GitHub REST 对应 `GET /repos/{owner}/{repo}/issues/{issue_number}/comments`）：

```
CallMcpTool: github-mcp / <list_issue_comments 或 descriptor 中的等价工具>
  { owner, repo, issue_number }
```

> **参数以 MCP descriptor 为准**；若服务未暴露评论列表工具，如实告知用户「评论无法拉取」，仅以正文继续，并在分析结论中注明该限制。若分页或排序参数可选，按需拉取全部相关页直至覆盖近期讨论。

从 Issue 详情与评论的综合结果中提取关键信息：

- **标题与描述**：理解问题本质
- **标签/优先级**：判断严重程度
- **评论线程**：归类「复现 / 日志 / 环境 / 已知结论」，与正文合并建模，必要时在后续分析结论中点名引用（例如某位评论者的堆栈）

将问题归纳为一句话摘要，明确：**什么坏了** 和 **期望行为是什么**。

**拉取 Issue 后仍不足以开始探索时（进入阶段 3 前的门禁）**：

若正文与评论合并后仍说不清楚「出问题的场景 / 受影响功能」与「期望行为」，或几乎没有可供检索的具体线索（如版本、组件、报错原文、重现步骤、相关配置），**视同信息不足**：先向用户列出缺什么、建议补充什么（日志片段、截图中的错误、触发路径等），**不要**在此时展开大规模代码检索与阅读。**用户补充或通过讨论收窄范围后**再进入阶段 3。

### 阶段 3：分析定位

**开始前：处在主分支且与 upstream 同步**

在本地搜索、阅读代码做根因分析之前，先对齐主仓最新代码，避免在过期分支或孤立提交上看代码：

```bash
git fetch upstream
# 确定主分支名（与阶段 6 一致）：main 或 master
git ls-remote --heads upstream | grep -E 'refs/heads/(main|master)$'
# 检出本地主分支；若本地没有该分支则基于 upstream 创建
git checkout <base_branch> || git checkout -b <base_branch> upstream/<base_branch>
# 与 upstream 同步：禁止对主分支使用 git merge（会产生 merge commit）
git rebase upstream/<base_branch>
```

- **rebase 成功**：同步完成。
- **rebase 失败**（冲突无法解决，或决定不保留本分支相对 upstream 的独有提交）：先 `git rebase --abort`（若正处于 rebase 过程中），再执行 `git reset --hard upstream/<base_branch>`，使本地主分支与 upstream 指针完全一致。需要先与用户确认。
- **不要用** `git merge upstream/<base_branch>` 做主线同步。

若有未提交改动，先 `git stash` 或请用户处理，再执行上述步骤；否则 rebase 可能直接失败。同步完成后再进行下列分析步骤。

基于 Issue 描述在当前项目中定位问题：

1. **关键词提取**：从 Issue 正文与各条评论（阶段 2 已拉取）中提取错误信息、函数名、文件路径、堆栈等线索
2. **代码搜索**：用 Grep/SemanticSearch 在代码库中定位相关代码
3. **上下文理解**：读取相关文件，理解模块职责和调用链
4. **根因分析**：确定导致问题的根本原因，而非表象

输出定位结论：
- 问题根因
- 涉及的文件和代码位置
- 影响范围评估

#### Issue 评论门禁

在对话中输出完整分析结论。调用 MCP 发 Issue 评论须满足任一条件：

- 首次指令已写明发到 Issue（如「fix issue#42 并评论同步到 GitHub」）
- 后续对话中获取用户明确授权（如「发到 Issue」「同意发评论」）

用户要求修改分析结论时，更新后再次展示，等待确认后才可发布评论。

授权后按以下格式调用 MCP（工具名以 descriptor 为准，GitHub REST 对应 `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`）：

```
CallMcpTool: github-mcp / add_issue_comment
  { owner, repo, issue_number, … }
```

**评论正文 (`body`)** 使用 Markdown，结构与阶段 3 产出一致，按以下模板：

```markdown
- **摘要**：一两句话概括现象与根因研判
- **根因**：技术层面的原因说明
- **定位**：涉及的文件路径、符号或调用链要点（不写无关大段代码）
- **影响范围**：简要评估
- **说明**：若存在不确定点或仍需信息，单列「待确认」
```

**边界与失败处理**：

- 调用前必读 MCP 工具 schema，必填字段以 schema 为准。
- 若 MCP 报错：向用户如实说明，分析结论仍保留在对话中。

是否已将分析同步到 Issue **不影响**进入阶段 4（修复）。

### 阶段 4：最小化修复

**核心原则：改动越少越好。**

1. 只修改直接导致问题的代码
2. 不做无关重构、不改代码风格、不添加无关功能
3. 修复应与项目现有代码风格保持一致
4. 如果修复涉及多个方案，选择侵入性最小的

遵循以下修复步骤

#### 方案澄清

向用户说明修复方案，得到确认后进行下一步

#### 确保本地基于最新的 upstream 主分支：

```bash
# 解析两个 remote 的 owner/repo
git remote get-url upstream   # → upstream_owner / upstream_repo（PR 目标）
git remote get-url origin     # → fork_owner / fork_repo（个人 fork）
# origin 须按「Git 规约」第 2 条经 GitHub MCP 验证；查不到 fork 时阻塞（第 3 条）

# 确定主分支名（main 或 master）
git ls-remote --heads upstream | grep -E 'refs/heads/(main|master)$'
# → 确定 base_branch

# 拉取 upstream 最新代码
git fetch upstream
```

#### 准备 issue 修复分支

```
# 基于 upstream 最新主分支创建修复分支，分支名遵循格式 fix/issue-{issue_number}
git checkout upstream/{base_branch}
git checkout -b fix/issue-{issue_number}
```

### 阶段 5：验证

修复后执行验证（按目标仓库语言的工具链选择命令）：

1. **静态检查**：用 ReadLints 检查修改文件是否引入 lint 错误
2. **构建验证**：运行项目构建命令（如 `mvn compile`、`npm run build` 等），确保编译通过
3. **测试验证**：运行项目测试命令（如 `pytest`、`mvn test`、`npm test`、`bats` 等），确保已有测试不被破坏
4. **问题复查**：回顾 Issue 描述，确认修复逻辑覆盖了问题场景

如果验证失败，分析原因并修正，重复此阶段直到通过。

### 阶段 6：提交与创建 PR

验证通过后，**不得**直接创建 commit 和 PR，应当先拟定 commit 消息，再**询问用户**是否需要创建 commit 和 PR。

commit 消息规范：
- 符合 Conventional Commits 格式，<type>(<scope>): <short description>。示例：
  - fix(auth): resolve login issue with new users
  - feat(user-profile): add profile picture upload functionality
  - refactor(api): optimize data fetching logic
- commit 应当精简，最多3句话，禁止换行、分段等
- 使用英语编写 commit 消息
- 通过 `git commit -s` 提交，message 尾部自动生成 DCO `Signed-off-by`（openAN 是 LFN 项目，硬性要求）

#### 6a. 提交并推送分支

如果用户确认，则提交并推送到 origin（个人 fork）。commit 的用户名与邮箱用当前用户的 GitHub 信息（规约第 5 条）。

```bash
# 提交变更（-s 生成 Signed-off-by 尾注）
git add <changed_files>
git commit -s -m "fix: <简洁描述问题修复>"

# 推送到个人 fork
git push -u origin fix/issue-{issue_number}
```

PR 评审修改或打回后再推时，按规约第 6 条：先把本分支相对目标基线的提交 squash 成 1 个 commit（squash 后重新确认含 `Signed-off-by`），再 `git push --force-with-lease origin fix/issue-{issue_number}`。

#### 6b. 创建 PR

使用 `Skill` 工具调用 **`github-pr-manager`**（冲突预检、统计、检测、squash 建议、模板校验、写入 `.pr.draft.md`、`create_pull_request` / `update_pull_request` 等由该 skill 统一处理）。本阶段只组装 Issue 修复场景的个性化字段：

| 字段 | 取值 |
|------|------|
| `title` | `fix: <问题简述>` |
| `head` | `fix/issue-{issue_number}`（跨仓时使用 `fork_owner:fix/issue-{issue_number}` 格式） |
| `base` | `<base_branch>` |
| `body` | 按 `github-pr-manager` 的 `templates/pr-template.md` 填写；Issue 引用规则见下 |

**Issue 关联规则**（写进 PR body，传给 `github-pr-manager`，勿在本 skill 重复实现 MCP 调用）：

- **同仓**：正文「关联 Issue」章节填完整 URL `https://github.com/<owner>/<repo>/issues/<number>`；仅当用户明确要求「合并后关闭本 Issue」时改用 closing keyword `Closes #<number>`（GitHub 会在合并时自动关闭）
- **跨仓**：不写 closing keyword（跨仓 closing keyword 不生效）；在 `body` 与 commit message 中写清原始 Issue 完整链接或 `owner/repo#number`

### 阶段 7：PR 审核（创建 PR 后自动执行）

PR 创建成功后，**自动调用** `github-pr-review` skill 对新创建的 PR 进行审核：

1. **获取 PR 信息**：记录新创建 PR 的编号 `pull_number`
2. **调用审核技能**：使用 `Skill` 工具调用 `github-pr-review`
   - 传入参数：PR 的 `owner`、`repo`、`pull_number`
3. **审核结果处理**：
   - 等待 `github-pr-review` 完成审核并提交评论
   - 向用户报告审核已完成，展示审核结论摘要
   - 告知用户 PR 已创建并已完成自动审核，可查看 PR 页面获取详细评审意见

**调用示例**：
```
Skill: github-pr-review
参数: owner=<upstream_owner>, repo=<upstream_repo>, pull_number=<新PR编号>
```

> **注意**：PR 审核阶段在 PR 创建成功后**自动执行**，无需用户额外确认。

## 关键决策点

### Issue 仓库 = upstream（常见情况）

- PR 由 `github-pr-manager` 创建或同步
- PR body「关联 Issue」章节填完整 URL；需要自动关单时才用 `Closes #N`
- 默认不主动关闭 Issue；只有用户明确要求时才写 closing keyword

### Issue 仓库 ≠ upstream

当 Issue 所在仓库与 upstream 不同时：
- Issue 信息按用户提供的 owner/repo 读取
- PR 仍通过 `github-pr-manager` 创建或同步到 upstream；正文写原始 Issue 完整链接或 `issue_owner/issue_repo#number`
- **不要**默认写 closing keyword（跨仓不生效）

### 无法定位问题

如果经过充分搜索仍无法定位问题：
1. 向用户报告已搜索的范围和排除的可能性
2. 列出需要的额外信息（日志、配置、复现步骤等）
3. 不要猜测性地修改代码

### 修复风险较大

如果修复可能引入副作用：
1. 向用户说明风险点
2. 建议额外的测试覆盖
3. 等待用户确认后再修改

## git remote 解析

本工作流需要解析两个 remote：

| Remote | 角色 | 用途 |
|--------|------|------|
| `upstream` | 主仓库 | PR 目标、Issue 来源、同步基线 |
| `origin` | 个人 fork | 推送修复分支 |

从 remote URL 中提取 owner 和 repo：

| URL 格式 | 示例 | 解析 |
|-----------|------|------|
| HTTPS | `https://github.com/owner/repo.git` | 取路径倒数两段，去 `.git` |
| SSH | `git@github.com:owner/repo.git` | 取 `:` 后部分，去 `.git` |

### remote 缺失处理

如果 `upstream` remote 不存在：
1. 提示用户添加：`git remote add upstream <主仓URL>`
2. 不要自动猜测主仓地址
