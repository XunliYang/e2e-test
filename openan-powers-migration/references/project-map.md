# openAN 项目地图（project-openan）

> 来源：https://github.com/project-openan 各仓库 README 与目录结构（2026-11 核实）。
> 本文是迁移 agent 理解 openAN 组件关系与测试迁移顺序的唯一事实来源。

## 1. 组件关系图

```
┌─────────────────────────────────────────────────────────────────────┐
│                        协议层（最底层，无内部依赖）                    │
│   a2a-t-sdk-python ──同契约── a2a-t-sdk-java                        │
│   （A2A-T 协议 SDK：Task-T / Negotiation-T / Notification-T / Auth-T）│
└──────────────┬──────────────────────────────────────┬───────────────┘
               │ 依赖（workflow-exec-engine 要求 a2a-t-sdk>=1.2.0,<2）
               ▼
┌──────────────────────────────────────────────────────────────┐
│              工作流引擎层（嵌入式执行引擎 SDK）                  │
│   workflow-engine-sdk-python ──同业务契约── workflow-engine-sdk-java│
└──────────────┬───────────────────────────────────────────────┘
               │ orchestration-center 依赖（>=0.1.1,<0.2）+ a2a-t-sdk
               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    编排 / 注册 中心（运行时互相依赖）                       │
│  ┌───────────────────────────┐      运行时调用（拉取 AgentCards、           │
│  │ orchestration-center      │      AGENT_REGISTRY_URL / openan-net）     │
│  │  单仓库多部分：             │◄────────────────────────────┐             │
│  │  ├─ 后端 orchestrate:5001 │                             │             │
│  │  ├─ 前端 workflow-designer│                             │             │
│  │  ├─ host_agent（Host 进程）│                             │             │
│  │  └─ samples（示例 A2A Agent）│                           │             │
│  └───────────────────────────┘                             │             │
│  ┌───────────────────────────┐                             │             │
│  │ registry-center           │─────────────────────────────┘             │
│  │  单仓库多部分：             │  Agent 注册/发现/心跳/审批/语义检索           │
│  │  ├─ 后端 agent_registry:5000│                                          │
│  │  └─ 前端 registry-center-web│                                         │
│  └───────────────────────────┘                                          │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     可观测性族（独立成体系）                             │
│  observability-center（单仓库：后端服务 + Portal 前端视图）              │
│        │ 使用                                                          │
│        ▼                                                              │
│  observability-sdk-python / -java / -ts（同一能力的多语言 SDK）          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  独立组件（与其他项目无代码/运行时依赖）                                  │
│  knowledge-service（后端服务）、openan-portal（门户前端）、              │
│  project-openan.github.io（文档站）、openan-installation（部署工具）      │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. 仓库清单与测试框架矩阵

| 仓库 | 语言 | 类型 | 职责 | 测试框架 | 关键依赖/约束 |
| ---- | ---- | ---- | ---- | ---- | ---- |
| `a2a-t-sdk-python` | Python | SDK | A2A-T 协议 Python SDK | pytest | 无内部依赖 |
| `a2a-t-sdk-java` | Java | SDK | A2A-T 协议 Java SDK | JUnit 5 | 与 python 版同契约 |
| `workflow-engine-sdk-python` | Python | SDK | 宿主嵌入式工作流执行引擎 | pytest | `a2a-sdk>=1.1.2,<2`、`a2a-t-sdk>=1.2.0,<2`；包名 `workflow-exec-engine` |
| `workflow-engine-sdk-java` | Java | SDK | 同上 Java 版 | JUnit 5 (Maven) | 与 python 版同业务契约 |
| `registry-center` | Python + JS | 后端+前端单仓库 | AgentCard 注册/发现/审批/心跳/语义检索 | 后端 pytest；前端 Vitest + Playwright | 后端 `agent_registry/`（HTTPS :5000）；前端 `registry-center-web/`；单实例部署 |
| `orchestration-center` | Python + JS | 后端+前端单仓库 | 多智能体工作流可视化编排与执行 | 后端 pytest；前端 Vitest + Playwright | 依赖 `workflow-exec-engine>=0.1.1,<0.2`、`a2a-t-sdk>=1.2.0,<2`；后端 `orchestrate/`（:5001）、前端 `workflow-designer/`（:3003）、`host_agent/`、`samples/`；运行时依赖 registry-center |
| `observability-center` | Python + JS | 后端+Portal 单仓库 | 可观测性服务与 Portal 视图 | 后端 pytest；前端 Vitest + Playwright | 使用 `observability-sdk-python` |
| `observability-sdk-python` | Python | SDK | 可观测性 Python SDK | pytest | 独立 |
| `observability-sdk-java` | Java | SDK | 可观测性 Java SDK | JUnit 5 | 独立 |
| `observability-sdk-ts` | TypeScript | SDK | 可观测性 TS SDK | Vitest | 独立 |
| `knowledge-service` | Python | 后端服务 | 知识库构建、文档处理、检索编排、知识问答 | pytest | 独立 |
| `openan-portal` | JavaScript | 前端门户 | OpenAN 门户 | Vitest + Playwright | 独立 |
| `project-openan.github.io` | JavaScript/HTML | 文档站 | 官方文档网站 | Vitest（可测逻辑）+ Playwright | 独立 |
| `openan-installation` | Shell | 部署工具 | 安装部署脚本、容器与 K8s 部署 | Bats-core + ShellCheck（+ Kind 验证部署） | 消费上述后端组件 |

**排除项**：组织内 `integration-test` 仓库不在迁移与测试范围；另有 `docs`、`governance`、`.github` 等非测试仓库。

## 3. 依赖层级与迁移/测试顺序

```
第 1 层：a2a-t-sdk-python / a2a-t-sdk-java          （纯协议 SDK，无内部依赖）
第 2 层：workflow-engine-sdk-python / -java          （依赖第 1 层）
第 3 层：registry-center、observability-sdk-python/java/ts（相互独立）
第 4 层：orchestration-center、observability-center  （依赖第 1/2/3 层）
第 5 层：knowledge-service、openan-portal、project-openan.github.io、openan-installation
```

含义：

- 测试代码生成/迁移应按层推进，下层 SDK 的测试基线先行，上层 center 依赖下层产物。
- `orchestration-center` 的端到端验证需要 `registry-center` 可达（`AGENT_REGISTRY_URL`，Docker 场景共享 `openan-net` 网络）。
- 改 SDK 的破坏性变更会沿依赖链上传导，评审时应标注影响面层级。

## 4. 易错点（迁移 agent 注意）

1. **`registry-center`、`orchestration-center`、`observability-center` 各是一个仓库**，其「前端」是仓库内子目录，不是独立仓库；源技能中「按仓库找前端目录」的逻辑要按此调整。
2. `orchestration-center` 与 `registry-center` 是**运行时关联**（拉取 AgentCards），不是代码依赖；不要把 registry 的 API 当作编排后端的编译期接口。
3. `workflow-engine-sdk-*` 对 `a2a-t-sdk-*` 的版本约束（`>=1.2.0,<2`）是硬约束，写 SDK 相关测试或修复指令时必须引用。
4. Python 组件统一要求 Python 3.12+；`orchestration-center` 前端要求 Node.js 20.19+。
5. `workflow-engine-sdk-python` 的发布包名是 `workflow-exec-engine`，引用时用包名而非仓库名。
