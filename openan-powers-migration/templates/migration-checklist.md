# 迁移追踪清单（模板）

> 迁移 agent 在目标仓库根目录维护此清单，每完成一项更新状态。状态取值：`待迁移` / `进行中` / `已完成` / `降级迁移` / `不迁移`。

| 源技能 | 分类 | 目标名称 | 适配要点（一行） | 状态 | 备注 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| `gitcode-issue-creator` | 平台协作类 | `github-issue-creator` | GitHub MCP；看板/里程碑降级为 labels | 待迁移 | |
| `gitcode-issue-fixer` | 平台协作类 | `github-issue-fixer` | 读 Issue/评论换 GitHub MCP | 待迁移 | |
| `gitcode-issue-dispatcher` | 平台协作类 | `github-issue-dispatcher` | webhook 载荷改 GitHub 事件格式 | 待迁移 | |
| `gitcode-pr-manager` | 平台协作类 | `github-pr-manager` | `.pr.draft.md` 机制保留 | 待迁移 | |
| `gitcode-pr-review` | 平台协作类 | `github-pr-review` | 评审评论到 GitHub PR | 待迁移 | |
| `gitcode-pr-gate-diagnoser` | 平台协作类 | `github-pr-gate-diagnoser` | 检查页→Checks API/Actions 日志；`/retest`→re-run workflows | 待迁移 | |
| `gitcode-pr-changie` | 平台协作类 | `github-pr-changie` | changie 保留；PR 交互换 GitHub MCP | 待迁移 | |
| `gitcode-pr-codecheck` | 平台协作类 | 待定 | CodeCheck 为 GitCode 专属 | 待迁移 | 需决策：改造或弃用 |
| `cve-fixer` | 平台协作类 | `openan-cve-fixer` | CVE Issue 流程换 GitHub MCP | 待迁移 | |
| `e2e-bug-issue-creator` | 平台协作类 | `e2e-bug-issue-creator` | 里程碑/看板推荐删除或降级 | 待迁移 | |
| `feature-level-test-cases-gen` | 用例生成类 | `openan-feature-level-test-cases-gen` | CSV 14 列→12 列 + 三新列 | 待迁移 | |
| `dfx-test-cases-gen` | 用例生成类 | `openan-dfx-test-cases-gen` | 同上 | 待迁移 | |
| `test-cases-reviewer` | 用例生成类 | `openan-test-cases-reviewer` | 列校验改 12 列 + 三新列 | 待迁移 | |
| `test-cases-generator` | 用例生成类 | `openan-test-cases-generator` | 编排子技能名替换 | 待迁移 | |
| `e2e-test-code-gen` | E2E 执行类 | `e2e-test-code-gen` | Ginkgo→pytest/JUnit5/Vitest/Bats | 待迁移 | |
| `e2e-test-runner` | E2E 执行类 | `e2e-test-runner` | 四阶段保留；删除 SSH 虚机路径 | 待迁移 | |
| `e2e-test-regression` | E2E 执行类 | `e2e-test-regression` | 修复对象扩为多语言测试代码 | 待迁移 | |
| `e2e-failure-analyzer` | E2E 执行类 | `e2e-failure-analyzer` | 证据格式改 JUnit XML/Playwright report | 待迁移 | |
| `e2e-issue-retest` | E2E 执行类 | `e2e-issue-retest` | 回写 GitHub Issue；runner 命令替换 | 待迁移 | |
| `e2e-issue-verifier` | E2E 执行类 | `e2e-issue-verifier` | 双路径改本地/容器验证 | 待迁移 | |
| `e2e-failure-cluster-board` | E2E 执行类 | `e2e-failure-cluster-board` | 输入改 JUnit XML/Playwright report/Actions 产物 | 待迁移 | |
| `requirement-decomposition` | 研发流程类 | 同名 | 术语与链接替换 | 待迁移 | |
| `solution-design` | 研发流程类 | 同名 | 术语替换；oFEP 引用按决策处理 | 待迁移 | |
| `ofep-converter` | 研发流程类 | 待定 | OFEP 为 openFuyao 专属 | 待迁移 | 需决策：改造为通用提案或弃用 |
| `ofep-index-builder` | 研发流程类 | 待定 | 同上 | 待迁移 | 需决策 |
| `design-reviewer` | 研发流程类 | 同名 | 语言无关，轻量替换 | 待迁移 | |
| `design2code` | 研发流程类 | 同名 | PR 流程交 github-pr-manager | 待迁移 | |
| `code-reviewer` | 质量门禁类 | 同名 | 平台引用替换 | 待迁移 | |
| `doc-reviewer` | 质量门禁类 | 同名 | 平台引用替换 | 待迁移 | |
| `repo-insight` | 质量门禁类 | 同名 | 数据源换 GitHub | 待迁移 | |
| `skill-governor` | 质量门禁类 | 同名 | 治理对象改 openAN-powers | 待迁移 | |
| `openapi-doc-check` | 质量门禁类 | 同名 | 基线获取改 GitHub raw | 待迁移 | |
| `code-doc-consistency-check` | 质量门禁类 | 待定 | go-restful 场景，openAN 无 Go 仓库 | 待迁移 | 默认不迁移或通用化，需决策 |
| `pipeline-issue-reviewer` | CI 流水线类 | 同名 | 环境变量改 `$GITHUB_*` | 待迁移 | |
| `pipeline-pr-gate-diagnoser` | CI 流水线类 | 同名 | 日志来源改 GitHub Actions | 待迁移 | |
