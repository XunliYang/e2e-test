---
name: e2e-failure-analyzer
description: 面向 openAN 测试失败的分析器：根据失败日志、JUnit XML、Playwright report、截图、trace 或 GitHub Issue 链接，提取失败证据、做轻量聚类，并判定根因属于 E2E_CODE_BUG、SOURCE_BUG、ENV_INFRA、FLAKY_TIMING 或 INSUFFICIENT_INFO；只产出结构化结论与后续调用文本，不执行、不改代码、不建 Issue
---

# e2e-failure-analyzer

## 触发条件

openAN 仓库测试失败后的根因分析、失败聚类，或运行 /e2e-failure-analyzer。

## 分析流程

1. **证据提取**：从 runner 结构化输出 / JUnit XML / Playwright report / 日志中收集失败用例名、断言、堆栈、环境信息（语言、命令、commit SHA）
2. **聚类**：相同报错签名（堆栈关键帧 + 断言文本归一化）归为同簇，减少重复分析
3. **根因分类**（每簇给出判定与置信度）：

   | 分类 | 判据（满足其一即可，注明证据） |
   | --- | --- |
   | E2E_CODE_BUG | 断言写错、选择器失效、mock 与真实协议不符、用例间共享状态 |
   | SOURCE_BUG | 被测代码行为与文档/协议承诺不符（附协议条款或 API 文档引用） |
   | ENV_INFRA | 服务未就绪、端口/网络、依赖缺失、docker 不可用 |
   | FLAKY_TIMING | 时序敏感：重跑即过、超时边界、异步等待不足 |
   | INSUFFICIENT_INFO | 证据不足以支撑以上任一类 |

4. **交叉语言注意**：A2A-T 互操作失败时，必须判断是 Java 侧、Python 侧还是协议样本不一致（`a2a-t-corpus` 数据漂移）

## 输出（交后续技能的调用文本）

- 结构化结论（Markdown 表格：簇、用例、分类、置信度、关键日志摘要）
- 按分类生成后续调用文本：
  - SOURCE_BUG → `github-issue-creator` 输入草稿
  - E2E_CODE_BUG → `e2e-test-regression` 修复指令（含测试文件路径与验证命令）
  - ENV_INFRA / FLAKY / 信息不足 → 诊断与补证建议

## 硬性约束

- 不直接执行命令、不修改代码、不创建 Issue、不回填任何平台
- 证据引用必须带文件路径与行号或日志行号，禁止凭猜测下结论
