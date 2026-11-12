# 评审 CSV → 测试代码生成指导

## 1. 定位

将**评审通过**的 openan 16 列用例 CSV（官方 15 列 + component_deps 独立列） 转为目标仓库内可运行的测试代码（Python pytest / Java JUnit5 / JS Vitest+Playwright / Shell bats）。表头与 `../test-cases-generator/templates/case-template.csv` 一致（openan-itest `docs/templates/testcases-template.csv`）。

## 2. CSV 格式（固定 16 列）

```csv
里程碑,用例名称,用例编号,模块,component_deps,需求链接,用例类型,优先级,前置条件,步骤描述,预期结果,可自动化,对应自动化用例,开发负责人,测试负责人,备注
```

样例：[评审CSV样例.csv](评审CSV样例.csv)

编排键（`language_profile` / `protocol_primitive` / `执行策略` / `环境` / `DFX类型`）不单独成列，以 `键:值` 写在「备注」列；`component_deps` 为第 5 列独立列，不写入备注，`；` 分隔；`parse-test-cases.mjs` 自动解析到对应字段，模型无需手工拆备注。

## 3. 字段 → 代码映射

| CSV 列 | 代码映射（按 profile） |
|--------|------------------------|
| `用例编号` | python：测试 docstring 首行 `"""FIT-registry-center-agentcard-001: <用例名称>"""`；java：`@DisplayName("FIT-...: ...")`；js：`test("FIT-...: ...")` 或 `test.describe`；shell：`@test "DFX-...: ..."` |
| `用例名称` | 测试描述主体（自然语言，不加用例编号前缀） |
| `用例类型` | DFX 行（备注 `DFX类型` 键为 DFT/DFD/…/DFC）生成时断言必须含日志级别/关键字、指标、health/metrics 端点等可观测项 |
| `模块` | 测试文件归属；文件命名分组键（python `test_<feature>_<scenario>.py`） |
| `优先级` | 过滤/排序元数据（`--priority P0,P1`）；可写入标记或报告 |
| `可自动化` | `否` 的行跳过生成（P2 可自动化为否且备注说明原因）；P0/P1 必为「是」 |
| `里程碑` | 写入用例元数据（可为空） |
| `对应自动化用例` | 生成阶段为空；生成后回填 `<测试文件>::<测试函数>` |
| `前置条件` | fixtures / `@BeforeEach` / `setup()`；环境准备步骤 |
| `步骤描述` | 按序号逐条实现；`见结果N` 处插入对应断言；末步清理动作实现为 teardown/清理步骤 |
| `预期结果` | 断言实现来源；逐步编号与步骤对应 |
| 备注 `language_profile` | 决定目标 profile 与框架；逐条读取，允许混合（如跨组件互调用例落 java） |
| `component_deps`（第 5 列） | 编排依赖：compose 服务清单；`none` 单组件 |
| 备注 `protocol_primitive` | `Task-T`/`Notification-T`/`Negotiation-T`/`Authorization-T` → 用 A2A-T SDK 编排；`none` → REST/CLI |
| 备注 `执行策略` | `smoke`/`full`/`slow` → 映射为测试标记（如 pytest mark `smoke`，JUnit Tag `smoke`），供 CI 按策略过滤 |
| 备注 `环境` | 运行环境（框架 §6.4，如 `docker-compose`/`with-workload-cluster`/`online`/`offline`）→ 映射为环境标记，供 CI 环境过滤 |
| 备注其它键 | `设计方法`、`里程碑`（旧备注键已不再使用，里程碑取自列）、来源、待确认项 → 参考信息，写入测试 docstring 注释 |

## 4. 场景推断（scenario）

`parse-test-cases.mjs` 从 用例名称/步骤描述/预期结果/备注/前置条件 推断 `scenario`，辅助识别场景类型：

| scenario | 触发特征（命中顺序从上到下） |
|----------|------------------------------|
| `service_startup` | docker compose / 启动服务 / health 检查就绪 |
| `agent_register` | 注册 / POST /v1/agents |
| `agent_query` | 查询 / GET / 列表 / 分页 |
| `agent_update_delete` | 更新 / 注销 / PUT / DELETE |
| `task_dispatch` | 任务下发 / Task-T / 跨组件 |
| `protocol_negotiation` | 协商 / Negotiation-T / Authorization-T |
| `service_restart` | 重启容器 / 进程 / 数据保持 |
| `invalid_input` | 非法 / 拒绝 / 400 / 422 / 不存在 / 404 |
| `boundary` | 边界 / 长度上限 / 63 字符 / 64 字符 |
| `concurrency` | 并发 / 幂等 / 重复 |
| `generic` | 未命中以上 |

`scenario` 仅作文件分组与命名建议，具体样式一律以目标仓既有测试文件为准。

## 5. 入口类型推断（entry_type）

从 步骤描述 与备注 `protocol_primitive` 推断，辅助决定编排方式：

| entry_type | 触发特征 | 编排方式 |
|------------|----------|----------|
| `A2A-T` | 备注 `protocol_primitive` ≠ none，或步骤含 Task-T / Notification-T / Negotiation-T / Authorization-T / JSON-RPC | A2A-T SDK 客户端 |
| `UI` | 控制台 / 页面 / 登录 / 浏览器 | Playwright |
| `Compose` | docker compose / 容器 / 服务启动 | compose CLI + REST 客户端 |
| `API` | api / http / curl / rest（默认） | profile 默认 HTTP 客户端 |

## 6. 用例筛选与跳过

- `--ids FIT-registry-center-agentcard-001,FIT-registry-center-agentcard-002`：只生成指定用例编号
- `--priority P0,P1`：只生成指定优先级
- 跳过：「用例类型」不在 功能测试/异常测试/协议测试 且备注不含合法 `DFX类型` 键，或「用例编号」为空；跳过行必须在交付摘要中列出
