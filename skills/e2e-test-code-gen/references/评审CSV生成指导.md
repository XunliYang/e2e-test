# 评审 CSV → 测试代码生成指导

## 1. 定位

将**评审通过**的 openan 12 列测试用例 CSV 转为目标仓库内可运行的测试代码（Python pytest / Java JUnit5 / JS Vitest+Playwright / Shell bats）。表头与 `../test-cases-generator/templates/case-template.csv` 一致。

## 2. CSV 格式（固定 12 列）

```csv
case_id,type,module,title,precondition,steps,expected_result,priority,language_profile,component_deps,protocol_primitive,notes
```

样例：[评审CSV样例.csv](评审CSV样例.csv)

## 3. 字段 → 代码映射

| CSV 列 | 代码映射（按 profile） |
|--------|------------------------|
| `case_id` | python：测试 docstring 首行 `"""FIT-RC-001: <title>"""`；java：`@DisplayName("FIT-RC-001: ...")`；js：`test("FIT-RC-001: ...")` 或 `test.describe`；shell：`@test "FIT-INS-001: ..."` |
| `title` | 测试描述主体（自然语言，不加 case_id 前缀） |
| `type` | DFX 行（DFT/DFD/…/DFC）生成时断言必须含日志级别/关键字、指标、health/metrics 端点等可观测项 |
| `module` | 测试文件归属模块；文件命名分组键（python `test_<module>_<scenario>.py`） |
| `priority` | 过滤/排序元数据（`--priority P0,P1`）；可写入标记或报告 |
| `language_profile` | 决定目标 profile 与框架；逐条读取，允许混合（如 FIT-RC-012 落 java） |
| `component_deps` | 编排依赖：compose 服务清单；`none` 单组件 |
| `protocol_primitive` | `Task-T`/`Notification-T`/`Negotiation-T`/`Authorization-T` → 用 A2A-T SDK 编排；`none` → REST/CLI |
| `precondition` | fixtures / `@BeforeEach` / `setup()`；环境准备步骤 |
| `notes` | 解析 `键:值`（分号分隔）；`里程碑:vX.Y` 写入用例元数据；故障注入说明（重启容器、断网、错误凭据） |
| `steps` | 按序号逐条实现；`见结果N` 处插入对应断言 |
| `expected_result` | 断言实现来源；逐步编号与步骤对应 |

## 4. 场景推断（scenario）

`parse-test-cases.mjs` 从 title/steps/notes/precondition 推断 `scenario`，辅助识别场景类型：

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

从 steps 推断，辅助决定编排方式：

| entry_type | 触发特征 | 编排方式 |
|------------|----------|----------|
| `A2A-T` | 步骤含 Task-T / Notification-T / Negotiation-T / Authorization-T / JSON-RPC | A2A-T SDK 客户端 |
| `UI` | 控制台 / 页面 / 登录 / 浏览器 | Playwright |
| `Compose` | docker compose / 容器 / 服务启动 | compose CLI + REST 客户端 |
| `API` | api / http / curl / rest（默认） | profile 默认 HTTP 客户端 |

## 6. 用例筛选与跳过

- `--ids FIT-RC-001,FIT-RC-002`：只生成指定 case_id
- `--priority P0,P1`：只生成指定优先级
- 跳过：`type` 不在 FIT/DFT/DFD/DFS/DFR/DFP/DFNS/DFC 范围，或 `case_id` 为空；跳过行必须在交付摘要中列出
