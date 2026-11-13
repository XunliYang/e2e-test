---
name: e2e-test-regression
description: 依据 e2e-failure-analyzer 的失败分析报告，仅对明确归类为 E2E_CODE_BUG 的问题修改 openAN 仓库中的测试代码（Python/Java/JS/Shell 任一），做最小、安全、可回退的修改，产出可审核的差异与验证报告；不修复被测产品源码，不处理未分类或非测试代码缺陷
---

# e2e-test-regression

## 触发条件

用户拿着 e2e-failure-analyzer 的分析报告要求修复测试代码，或运行 /e2e-test-regression。

## 前置条件（不满足则拒绝执行）

1. 分析报告存在且每个待修项分类均为 `E2E_CODE_BUG`
2. 报告中含：测试文件路径、失败证据、验证命令
3. 目标仓库 git 工作区干净（或有明确授权的未提交变更范围）

## 修复原则

- **最小修改**：只动分析报告中点名的测试代码；禁顺手重构、禁格式化无关代码
- **语言一致**：修改风格遵循该仓库测试代码的既有风格，对应语言规范见 `skills/e2e-test-code-gen/references/<lang>.md`
- **可回退**：一个簇一个 commit（或一个独立 hunk），回退粒度 = 修复粒度
- **修后必验**：运行报告中的验证命令（至少覆盖被修用例），贴出结果

## 流程

1. 逐簇定位测试代码 → 2. 最小修改 → 3. 本地验证 → 4. 产出报告：

```markdown
## 修复报告
| 簇 | 用例ID | 测试文件 | 修改摘要 | 根因 | 验证命令与结果 |
```

## 硬性约束

- 被测产品源码一律不改；若发现疑似源码 Bug，停止该项并在报告中标注，交 `github-issue-creator`
- 分类为 SOURCE_BUG / ENV_INFRA / FLAKY_TIMING / INSUFFICIENT_INFO 的项直接跳过，不「顺手修」
- 不执行 git commit/push（除非用户另行明确授权）
