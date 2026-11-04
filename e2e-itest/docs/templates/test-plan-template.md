# <特性名称> 测试方案

> 版本：vX.Y | 日期：YYYY-MM-DD | 作者：<姓名> | 评审状态：待评审
> 关联特性提案：<链接> | 版本里程碑：vX.Y
> 归档路径：`docs/plans/<version>/`（评审通过后以 PR 合入）

---

## 1. 概述

### 1.1 目的

<说明本方案针对哪个特性/版本，验证什么目标。示例：验证 registry-center 在本版本内与其他组件集成正确，满足特性集成测试（FIT）准入与准出质量要求。>

### 1.2 范围

**纳入范围**（对齐框架 §5.2 集成测试边界）：

- 跨模块 API 调用、跨服务数据流、事件触发链
- 安装/升级/回滚路径
- 多特性组合使用（如 注册中心 + 编排中心 + 样例 Agent）
- 真实 Kubernetes 集群或虚拟机上终端用户关键路径

**不纳入范围**：

- 单函数边界条件（属模块仓库 UT）
- 纯 UI 布局与样式（属前端手工/UI 自动化）
- 大规模性能基准（属性能专项测试，见专项测试计划）

### 1.3 参考文档

| 文档 | 链接/路径 |
|------|----------|
| OpenAN 集成测试流程及框架 | `docs/OpenAN Integration Testing Process and Framework.md` |
| 特性提案 | <链接> |
| 组件 API 文档 | Registry Center API Reference / Orchestration Center API Reference |
| 部署契约 | `openan-installation/containerized/TRANSPORT_DEPLOYMENT.md` |
| 兼容性矩阵 | <专项测试计划链接> |

---

## 2. 被测对象

| 组件 | 仓库 | 版本/构建 | 测试层级 | 说明 |
|------|------|----------|----------|------|
| 注册中心 | `registry-center` | <tag/镜像 digest> | FIT | AgentCard 注册/检索/心跳/变更广播 |
| 编排中心 | `orchestration-center` | <tag/镜像 digest> | FIT | 工作流编排、PSOP 生成、执行、SSE 事件 |
| A2A-T SDK | `a2a-t-sdk-python` / `a2a-t-sdk-java` | <版本> | UT（模块仓库）+ FIT（互操作） | JSON-RPC / HTTP+REST 双传输 |
| 工作流引擎 SDK | `workflow-engine-sdk-java` / `workflow-engine-sdk-python` | <版本> | UT（模块仓库） | Host Agent 执行引擎 |
| Portal | `openan-portal` | <tag> | UI 测试 | Showroom/Playground |
| 安装部署 | `openan-installation` | <tag> | 部署测试 | 在线 Helm / 离线 Compose |
| 样例 Agent | `openan-demo` | <tag> | FIT 依赖 | mockagent 场景包 |

---

## 3. 测试策略

### 3.1 测试层级

| 层级 | 执行方 | 范围 |
|------|--------|------|
| FIT | 特性工作组 | 本特性内多模块/服务集成正确性 |
| SIT | 集成测试工作组 | 发布级多特性组合、端到端闭环场景 |

### 3.2 测试类型

对齐框架 §10，按特性需要勾选：

- [ ] 功能测试（API 集成、事件链）
- [ ] 异常测试（网络故障、依赖故障、LLM 不可用降级）
- [ ] A2A-T 协议测试（Task-T/Negotiation-T/Notification-T/Authorization-T，双传输一致性，Python/Java SDK 互操作）
- [ ] 性能测试（关键接口 P99：AgentCard 注册/检索、工作流执行、A2A-T 协商）
- [ ] 压力/容量测试
- [ ] 长稳测试（7×24h）
- [ ] 可靠性/故障注入
- [ ] 安全测试（mTLS、JWS 校验、Authorization-T、提示注入过滤、漏洞扫描）
- [ ] 兼容性测试（K8s 版本×OS×数据库后端×浏览器）
- [ ] 部署形态测试（在线 Helm / 离线 Compose；升级/回滚）

### 3.3 测试方法

- 真实环境执行：FIT 在真实 K8s 集群/虚机执行，不在集成层 mock 被测服务
- LLM 依赖处理：外部 LLM 端点（models.yaml + 密钥注入）与 mock LLM 二选一；**依赖 LLM 输出的用例采用确定性断言**（断言结构/状态码/流程状态，不直接断言模型生成文本）
- 样例 Agent：使用 `openan-demo/mockagent` 或编排中心 samples 作为协作方
- 禁止事项：禁止 sleep 同步（使用框架 wait/retry）；禁止用例间共享可变状态；禁止断言缺失（log-only）

### 3.4 自动化策略

- P0/P1 用例 100% 自动化，可重复执行
- `execution` 标签分层：`smoke`（PR 门禁）/ `full`（Daily）/ `slow`（长稳类）
- 失败用例自动归档 issue 并保留现场（trace/log/截图/Pod 日志/K8s 事件）

---

## 4. 测试场景

| 场景 ID | 场景描述 | 涉及组件 | 优先级 | 备注 |
|---------|---------|----------|--------|------|
| SCN-<feature>-001 | <示例：意图输入 → 编排中心生成 PSOP → 注册中心检索 AgentCard → A2A-T 协商 → Host Agent 执行 → SSE 事件流闭环> | orchestration-center、registry-center、a2a-t-sdk、mockagent | P0 | 端到端闭环 |
| SCN-<feature>-002 | <场景描述> | <组件> | P1 | |
| ... | | | | |

---

## 5. 用例设计

### 5.1 编号规则

- FIT 用例：`FIT-<feature>-<topic>-<number>`，如 `FIT-registry-center-agentcard-001`
- SIT 用例：`SIT-<scenario>-<number>`，如 `SIT-complaint-handling-001`

### 5.2 优先级定义

| 优先级 | 定义 | 通过率要求 |
|--------|------|-----------|
| P0 | 阻断安装/核心闭环链路的场景 | 100%（TRR 准入与发布门禁） |
| P1 | 主要功能受损但有规避的场景 | 100% |
| P2 | 一般场景 | ≥80% |

### 5.3 标签维度

每个用例在代码中须打齐标签：`feature`、`environment`、`components`、`priority`、`execution`（`smoke`/`full`/`slow`）、`skip`（临时跳过须挂 issue）。

### 5.4 用例表

用例以 14 列 CSV 承载，与本方案同目录归档：`docs/plans/<version>/testcases-<feature>.csv`。字段填写规范见 [用例表字段说明](用例表字段说明.md)，模板见 [testcases-template.csv](testcases-template.csv)。

### 5.5 用例设计要求

- 每条用例含：前置条件、步骤、断言、清理动作（teardown 删除全部创建资源）
- 用例独立可重复，禁止依赖执行顺序（确需顺序时用显式声明）
- 会话级 fixture 仅限只读配置（如 LLM config、登录态）

---

## 6. 测试环境与数据

### 6.1 环境拓扑

| 项 | 取值 |
|----|------|
| 部署形态 | 在线 Helm（K8s 集群）/ 离线 Compose（单主机），按本版本受支持形态执行 |
| K8s/Helm 版本 | <版本，兼容范围见专项测试计划> |
| 集群规格 | <节点数/规格> |
| 环境提供方 | 集成测试工作组 |

### 6.2 依赖服务

| 依赖 | 配置方式 | 说明 |
|------|---------|------|
| LLM 端点 | models.yaml + `.env` 命名密钥，或 `USE_MOCK_LLM=true` | 语义检索/意图生成依赖 |
| 外部数据库 | MySQL/PostgreSQL（file/SQLite 为开发模式） | 部署 values 注入 |
| 镜像仓库 | `IMAGE_REGISTRY` | ghcr.io 或内网镜像仓库 |

### 6.3 测试数据

- AgentCard 样例（含签名/JWK 配置）
- PSOP 工作流模板、SPG 库样例
- mock/sample Agent（`openan-demo/mockagent`、编排中心 samples）

### 6.4 环境变量

见仓库根 `e2e/.env.template`，本方案新增变量须同步更新模板并在 README 文档化。

---

## 7. 准入准出

| 门禁 | 标准 | 来源 |
|------|------|------|
| TRR 准入（进入 FIT） | P0/P1 通过率=100%、P2≥80%、UT 覆盖率不降、镜像可部署 | 框架 §8.1 |
| FIT 准出 | 总通过率≥95%、失败用例归档 issue+`skip-temporarily`、性能不低于上版基线、报告经集成测试工作组评审 | 框架 §8.2 |
| SIT 准出/发布准入 | SIT 通过率=100% 无跳过、7×24h 无 P0/P1 故障、安装/升级/回滚全通过、无未关闭 P0（P1 有规避）、兼容性矩阵通过 | 框架 §8.3 |

---

## 8. 缺陷管理

- 分级与 SLA 按框架 §9.1（P0 24h 响应/本版本修复；P1 3 个工作日；P2 下一版本；P3 排期）
- 失败用例自动归档 issue，附 trace/log/截图/集群信息
- 修复 PR 须补回归用例并重跑该特性全部 FIT

---

## 9. 进度与分工

| 节点 | 日期 | 责任人 | 交付物 |
|------|------|--------|--------|
| 测试方案评审通过 | YYYY-MM-DD | <工作组测试负责人> | 本方案合入 `docs/plans/<version>/` |
| 用例编写完成 | YYYY-MM-DD | <测试负责人> | 用例 CSV + 自动化代码 |
| TRR 评审 | YYYY-MM-DD | <特性工作组 Maintainer> | TRR 结论（见测试 Checklist 第一章） |
| FIT 完成/报告评审 | YYYY-MM-DD | <测试负责人> | 测试报告 `docs/reports/<version>/` |

## 10. 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| 外部 LLM 不稳定导致用例抖动 | 用例通过率波动 | mock LLM/桩响应；确定性断言 |
| 环境资源不足（真实集群） | 测试延期 | 提前向集成测试工作组申请；复用社区实验室 |
| 跨语言 SDK 互操作差异 | 协商/执行失败 | A2A-T 协议一致性用例前置执行 |

---

## 11. 交付物与归档

| 交付物 | 归档路径 |
|--------|---------|
| 测试方案（本文档） | `docs/plans/<version>/` |
| 用例表 CSV | `docs/plans/<version>/testcases-<feature>.csv` |
| 测试代码 | `e2e/<feature>/` |
| 测试报告 | `docs/reports/<version>/`（模板见 [测试报告模板](test-report-template.md)） |

---

## 附录

- 测试 Checklist：`../docs/openan-test-checklist.md`
- 框架文档：`../docs/OpenAN Integration Testing Process and Framework.md`
