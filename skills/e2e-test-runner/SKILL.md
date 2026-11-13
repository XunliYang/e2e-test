---
name: e2e-test-runner
description: 配置并真实执行 openAN 目标仓库的测试（Python pytest/Java Maven/JS Vitest 与 Playwright/Shell bats），按预检、准备、执行、清理四阶段完整运行，实时透传日志，首个失败立即反馈，并输出可供 e2e-failure-analyzer 消费的结构化结果
---

# e2e-test-runner

## 触发条件

用户要求运行 openAN 某仓库的测试、执行生成的测试代码，或运行 /e2e-test-runner。

## 四阶段流程

### 1. 预检

按目标仓库语言检查工具链（缺失即中止并报安装指引）：

| 语言 | 检查项 |
| --- | --- |
| Python | `uv`、`pyproject.toml` 存在 |
| Java | `java -version`（17+）、`mvn -v` |
| JS | `node -v`（20+）、依赖已 `npm ci` |
| Shell | `bats --version`、`shellcheck`、`shfmt`；docker 场景另查 `docker info` |

### 2. 准备

- 读取目标仓库 `.env` / `env.example`，确认必需环境变量已注入（服务地址、token 等）
- e2e 层需先启动被测服务时，优先使用仓库自带 `docker-compose.yml`；启动后做健康检查（重试 ≤ 30 次，间隔 2s）

### 3. 执行

- 命令按语言分发（详见 `skills/e2e-test-code-gen/references/<lang>.md` 的运行命令节）
- 实时透传日志；**首个失败立即原样输出失败上下文**（用例名、断言、最近 50 行日志），不等待全部结束
- 支持 `--grep <用例ID>` 级别过滤执行

### 4. 清理

- 停止由本 runner 启动的服务与容器（只清理自己启动的，不动用户已有环境）
- 产物归档到 `<repo>/.test-output/<timestamp>/`：JUnit XML、Playwright report、覆盖率文件

## 结构化输出（交 e2e-failure-analyzer）

```json
{
  "repo": "project-openan/registry-center",
  "lang": "python",
  "command": "uv run pytest tests/ -q",
  "exitCode": 1,
  "failedCases": [
    {
      "caseId": "FIT-registry-center-agentcard-001",
      "testFile": "tests/integration/test_agent_register.py",
      "testName": "test_register_agent_success",
      "logPath": ".test-output/20261105/junit.xml",
      "evidence": "AssertionError: assert 500 == 201"
    }
  ]
}
```

## 硬性约束

- 不修改任何源码或测试代码（失败修复交 `e2e-test-regression` 或 `github-issue-creator`）
- 多组件联调场景：编排顺序必须写清（如 registry-center 先于 orchestration-center），失败时标注卡在哪个组件的启动
