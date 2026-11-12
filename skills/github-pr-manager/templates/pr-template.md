# GitHub PR 模板规范

创建或同步 PR 时按本文组装并校验 `title`、`body` 的规范文档。适用于 project-openan 组织仓库（GitHub 平台）。

## 标题

格式：

```text
<type>[optional scope]: <description>
```

允许的 `type`：

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复缺陷 |
| `docs` | 文档更新 |
| `style` | 代码格式调整（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建过程或辅助工具变动 |
| `ci` | CI 配置变更 |
| `build` | 构建系统或外部依赖变更 |

书写要求：

- 全文英文（`type` / `scope` / `description`）
- 现在时/祈使句（`fix`，不用 `fixed` / `fixes`）
- 描述首字母小写；不以句号结尾；简洁说明变更目的
- **PR 标题始终单行**
- 单 commit PR，复用该 commit 的 subject 作为标题

## Commit 与 DCO 签署

openAN 是 LFN 项目，所有 commit 必须通过 `git commit -s` 生成 DCO `Signed-off-by` 尾注：

```text
fix(registry): reject duplicate agent registration

Signed-off-by: Zhang San <zhangsan@example.com>
```

对 `upstream/<base>..HEAD` 范围内全部 commit 校验：

- Conventional Commits：`<type>[optional scope]: <description>`，subject 单行英文
- 现在时/祈使句；描述首字母小写；不以句号结尾
- **每个 commit 均含 `Signed-off-by` 尾注**（`git log --format='%B' upstream/<base>..HEAD` 抽查）

多 commit 场景：GitHub 在合并时由 maintainer 选择合并策略，建议在对话中建议「Squash and merge」；squash 后的首行消息与 PR 标题对齐，多行 body 用 `-` 列举各原始 commit（一行一条）：

```text
feat(api): add user profile endpoints

- add GET /profile handler
- add PATCH /profile validation
- cover profile update cases
```

不合规判定与处理见 `SKILL.md` §3 / §6。无论是否豁免，传入 MCP 的 `title` 须符合「标题」规范。

## 正文

涉及章节：`问题背景`、`PR 类型`、`关联 Issue`、`变更描述`、`发布说明`、`测试验证`、`备注`；`AI 使用声明`、`人工复核声明` 仅在使用 AI 辅助开发时填写，否则省略。

### PR 类型

使用 checkbox 从以下标签中选择一个或多个：

- `bug`：修复缺陷问题
- `feature`：新增需求的功能实现
- `refactor`：不改变行为的代码重构
- `documentation`：文档新增或更新
- `tests`：添加或增强测试覆盖率
- `chores`：维护任务，如依赖、配置文件、脚本等更新

与标题 `type` 建议对应（不强制等同）：`fix`→`bug`，`feat`→`feature`，`refactor`→`refactor`，`docs`→`documentation`，`test`→`tests`，`chore`→`chores`；其余 type（`style`/`perf`/`ci`/`build`）通常→`chores`。

### 关联 Issue

- 原则必填完整 URL：`https://github.com/<owner>/<repo>/issues/<number>`（不用裸 `#xxx`）
- 无相关 Issue 时提示先建 Issue（可调用 `github-issue-creator`）；仅用户明确豁免可填 `N/A` 或说明原因
- 需要合并后自动关闭 Issue 时，改用 closing keyword：`Closes #<number>`（仅同仓可用）；默认不写 closing keyword，由 maintainer 手动关闭

### 变更描述

清晰说明 PR 的目的和内容，使用有序列表罗列主要变更，并说明动机和背景

### 发布说明

- 无用户影响填写 `NONE`；有用户影响时详细描述变更内容。
- 如需用户操作，必须包含 `action required`

### 测试验证

以有序列表罗列可执行、可复现的执行验证流程

### 备注

其他补充信息，无补充则跳过该段落

### AI 使用声明

当本 PR 使用了 AI 辅助开发时，须填写本段；未使用则跳过该段落。

填写内容（建议分点，信息不足则写「未知/未告知」）：

1. **辅助工具**：写成 `工具 + 模型`。其中，工具为 Agent 产品或 IDE（如 Cursor、OpenCode）；模型为实际使用的模型名。多项则分号分割列出
2. **参与环节**：据实填写 AI 实际参与的开发环节，如代码起草、测试补充、文档改写等。**不得**写入「PR 标题/正文组装」或本 skill 名

**禁止项**：

- 禁止在本段列出当前 skill 名，或把「PR 标题/正文组装」写入参与环节
- 禁止把「AI 已自动合入 / AI 已完成人工评审」等表述写入声明
- 禁止伪造未使用过的工具或模型；辅助工具不得写成不含模型的裸工具名

### 人工复核声明

当本 PR 使用了 AI 辅助开发时，须填写本段；未使用则跳过该段落。

本段以 **checkbox** 写入 PR body。填写本段时：

- 写入下列条目
- 全部保持 `[ ]`，**不得**将任一项预勾选为 `[x]`
- 由贡献者或 Reviewer 在合入前自行勾选；未勾选不阻塞「创建 PR」，但应在对话中提示「合入前请完成人工复核勾选」

```markdown
## 人工复核声明

- [ ] 已人工阅读本 PR 的完整 diff（含测试与文档变更）
- [ ] 已人工确认标题、正文、关联 Issue 与变更范围一致
- [ ] 已人工确认测试验证步骤可复现，或已接受「不适用」说明
- [ ] 已人工确认理解关键路径、失败模式、回滚等变更点
```

更新已有 PR 时，若涉及代码的变更，应当全部改回 `[ ]`；当仅修改 PR 描述时，可保留人工已勾选的 `[x]`。

## 自查清单

调用 MCP 前按下列项校验，结果只在对话确认阶段展示，不写入正文，不阻塞创建流程：

- [ ] Commit 符合英文 Conventional Commits 且每个 commit 含 DCO `Signed-off-by`
- [ ] PR 标题符合英文标题规范
- [ ] 关联了正确 Issue（完整 URL）
- [ ] 代码变更单一专注
- [ ] 测试完备或已说明不适用
- [ ] 文档已更新或已说明不适用
- [ ] 发布说明填写完整
- [ ] `AI 使用声明`、`人工复核声明` 已按场景填写，或未使用 AI 辅助开发时已省略
- [ ] 填写「人工复核声明」时全部为未勾选 `[ ]`（创建时；同步且有代码变更时已重置）

## 默认正文模板

调用方未指定专用结构时使用：

```markdown
## 问题背景
<简述问题/需求背景及变更必要性>

## PR 类型
- [ ] `bug`
- [x] `feature`
- [ ] `refactor`
- [x] `documentation`
- [x] `tests`
- [ ] `chores`

## 关联 Issue
<完整 Issue URL；特殊豁免时填 N/A 或说明原因>

## 变更描述
1. <变更点1>
2. <变更点2>
...

## 发布说明
<NONE / 用户影响说明 / action required: ...>

## 测试验证
1. <测试验证项1>
2. <测试验证项2>
...

## 备注
<其他说明；无补充则跳过本段>

## AI 使用声明
- 辅助工具：<工具> + <模型>
- 参与环节：<代码起草 / 测试补充 / 文档改写 等>

## 人工复核声明
- [ ] 已人工阅读本 PR 的完整 diff（含测试与文档变更）
- [ ] 已人工确认标题、正文、关联 Issue 与变更范围一致
- [ ] 已人工确认测试验证步骤可复现，或已接受「不适用」说明
- [ ] 已人工确认理解关键路径、失败模式、回滚等变更点
```
