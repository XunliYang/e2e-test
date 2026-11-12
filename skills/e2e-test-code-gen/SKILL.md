---
name: e2e-test-code-gen
description: 根据评审后的 openan 测试用例 CSV（16 列用例表 = openan 官方 15 列 + component_deps 独立列；编排键 language_profile/protocol_primitive/执行策略/环境/DFX类型 以键值对写在备注列）与编排输入，先为目标仓库测试包生成架构规划与执行方案（tests/README.md），经用户确认后再生成可执行测试代码（Python pytest / Java JUnit5 / JS Vitest+Playwright / Shell bats），映射到目标仓 tests/ 或语言约定目录；编排输入不足时 STOP 并列出缺失项。用户要求生成 E2E 测试代码、做自动化测试代码生成，或把 CSV 转成可执行测试，以及运行 /e2e-test-code-gen 时使用。
---

# E2E Test Code Gen

将**评审通过的测试用例 CSV**（openan 16 列用例表 = 官方 15 列 + component_deps 独立列，由 test-cases-generator / test-cases-reviewer 产出）转换为**目标仓库**内可执行的自动化测试代码。

## 输入：评审用例 CSV（16 列：openan 官方 15 列 + component_deps 独立列）

```csv
里程碑,用例名称,用例编号,模块,component_deps,需求链接,用例类型,优先级,前置条件,步骤描述,预期结果,可自动化,对应自动化用例,开发负责人,测试负责人,备注
```

样例见 [references/评审CSV样例.csv](references/评审CSV样例.csv)；模板唯一事实来源为 `../test-cases-generator/templates/case-template.csv`。

| 列 | 用途 |
|----|------|
| `用例编号` | 写入测试用例标识（pytest docstring 首行 / JUnit `@DisplayName` / Playwright `test()` 标题 / bats `@test` 名），保证失败可回溯 CSV |
| `模块` | 决定测试文件归属与文件命名分组 |
| `component_deps` | 跨组件用例编排依赖清单（docker compose 服务拓扑、启动顺序）；`none` 单组件 |
| `用例名称` | 测试描述主体（自然语言，不加用例编号前缀） |
| `用例类型` | FIT 行 `功能测试`/`异常测试`/`协议测试`；DFX 行为映射值（`可靠性测试` 等），备注另含 `DFX类型:DFx` 键；DFX 用例生成时断言必须落到日志/指标/health 等非功能观测点 |
| `里程碑` | 写入用例元数据（可为空） |
| `前置条件` | 准备逻辑、故障注入（重启容器、断网、错误凭据等） |
| `步骤描述` / `预期结果` | 操作步骤与断言；步骤中 `见结果N` 对应断言编号；末步清理动作在代码中实现为 teardown/清理步骤 |
| `可自动化` | `是`/`否`；P0/P1 必为「是」（框架 §8.1） |
| `对应自动化用例` | 生成阶段留空；代码生成后回填 `<测试文件>::<测试函数>` |

**component_deps 独立列（第 5 列）**：`none` 或 openan 仓名（多个用 `|` 分隔），跨组件用例编排依赖清单。

**备注列编排键**（`键:值`，`；`分隔，`scripts/parse-test-cases.mjs` 自动解析）：

| 键 | 用途 |
|----|------|
| `language_profile` | **决定目标语言 profile**（python/java/js/shell）；逐条读取，允许一份 CSV 混合多种 profile（如跨组件互调用例按测试落地方标注）；缺失或非法时 STOP 并列出所在行 |
| `protocol_primitive` | A2A-T 四原语（Task-T/Notification-T/Negotiation-T/Authorization-T）或 none；协议用例须用对应 SDK/客户端编排，不得自造协议行为 |
| `执行策略` | `smoke`/`full`/`slow`；映射为测试标记（mark/tag），供 CI 按策略过滤 |
| `环境` | 运行环境（框架 §6.4 environment 维度，如 `docker-compose`/`with-workload-cluster`/`online`/`offline`）；映射为环境标记，供 CI 环境过滤 |
| `DFX类型` | DFX 行必填（DFT/DFD/DFS/DFR/DFP/DFNS/DFC）；决定 DFX 专项断言方向 |
| 其它（设计方法、来源、待确认项） | 参考信息，写入测试 docstring 注释 |

**STOP**：CSV 表头不符合上述 16 列（剥离 BOM 后比对）时，提示用户先经 test-cases-reviewer 评审修正，不得凭空生成。

**跳过规则**：「用例类型」不在 `功能测试`/`异常测试`/`协议测试` 且备注不含合法 `DFX类型` 键的行跳过并在报告中列出；「用例编号」为空的行跳过。

## 编排门禁（README 先行）

仅凭 CSV 不足以生成可执行代码，还须具备包级编排输入；缺失时 **STOP 并逐项列出缺失项**，不得凭空编造。生成代码前先产出目标仓 `tests/README.md`（架构规划与执行方案），**经用户确认后**才进入代码生成。详见 [references/测试包编排设计指导.md](references/测试包编排设计指导.md)。

## 语言 Profile 决策

1. **逐条直读备注 `language_profile` 键**（生成侧已必填），按值分组生成；`language_profile` 缺失或非法时 STOP 并列出所在行
2. profile 决定框架、目录结构、命名、运行命令与最小验证命令：

| profile | 框架 | 必读文件 |
|---------|------|----------|
| `python` | pytest + pytest-asyncio + httpx | [references/python.md](references/python.md) |
| `java` | JUnit5 + AssertJ + Mockito + WireMock | [references/java.md](references/java.md) |
| `js` | Vitest + Playwright + MSW | [references/js.md](references/js.md) |
| `shell` | bats-core + shellcheck + shfmt | [references/shell.md](references/shell.md) |

3. 生成任何代码前，必须先完整读取该 profile 文件，遵循其中的目录结构、命名规范与依赖约定

## 目标仓库与输出路径

- **目标仓库**：openan 多仓（`owner/repo`，如 `openan/registry-center`），代码落在**目标仓自身的测试目录**，遵循该仓既有约定（如已有 `tests/` 则沿用）
- **默认落点**：`tests/`（python/shell）或各语言 profile 规定的目录（java 的 `src/test/java`、js 的 `tests/e2e`）；测试包 README 固定为 `tests/README.md`
- **只写测试代码与测试配置**，禁止修改被测产品源码（发现源码缺陷 → 输出分析，交 `openan-e2e-failure-analyzer`）
- 每个测试文件头部注明来源 CSV 路径与用例编号列表，便于失败回溯

## 工作流程

1. **解析输入**：读取 CSV（用 `scripts/parse-test-cases.mjs` 校验表头并输出 codegen plan 输入）；确认目标仓库、用例范围（`--ids` / `--priority`）
2. **编排输入核对**：按编排设计指导 §3 逐项核对，缺失 → STOP 列清单
3. **生成 tests/README.md**：按 [templates/test-package-readme.example.md](templates/test-package-readme.example.md)，覆盖范围表、目录结构、fixtures/数据、环境变量契约、运行命令
4. **用户确认 README** → 之后才生成代码
5. **生成代码**：按 [references/代码生成指导.md](references/代码生成指导.md) 逐条映射；遵守 profile 的反模式清单
6. **自验证**：运行 profile 的最小验证命令（collect-only / test-compile / vitest run / bats --count），失败先修生成代码再交付
7. **交付摘要**：目录树 + 用例 ID ↔ 测试文件映射表 + 运行命令

## 脚本使用

```bash
node scripts/parse-test-cases.mjs <csv-path> [--ids FIT-registry-center-agentcard-001,FIT-registry-center-agentcard-002] [--priority P0,P1]
node scripts/validate-config.mjs [config-path]
node scripts/build-codegen-plan.mjs [config-path]   # = validate + parse + 输出完整 plan
node scripts/run.mjs [config-path]                  # 同上，一步执行
```

配置示例见 [assets/e2e-code-gen.config.example.json](assets/e2e-code-gen.config.example.json)。脚本只做解析、校验与计划输出，**不代写测试代码**。

## 反模式（禁止）

- 编造 URL / 端口 / 选择器 / 镜像 tag——一律来自编排输入或目标仓既有代码
- 硬编码密钥、token、密码——走环境变量 + `env.example` / `.env.template` 模式
- 生成与目标仓既有风格不一致的代码——先读该仓既有测试，对齐风格
- DFX 用例只断言业务结果——必须落到日志/指标/health 等可观测点（DFX 编写指导 §3）
- A2A-T 协议用例绕开 SDK 自造 JSON-RPC 报文——互操作样本用 `a2a-t-corpus` 既有数据
- 修改被测产品源码、删除/覆盖既有测试文件（`overwrite` 须配置显式开启且用户确认）

## 质量自检（交付前）

- [ ] CSV 表头 16 列校验通过；跳过行已在报告列出
- [ ] 每行备注 `language_profile` 键合法；分组生成，每组均读过对应 profile 文件
- [ ] README 先行且经用户确认；环境变量契约完整、无硬编码秘密
- [ ] 每个测试含用例编号标识；DFX 用例断言落在非功能观测点；协议用例使用对应原语
- [ ] 最小验证命令通过；交付含用例 ID ↔ 文件映射表（并回填「对应自动化用例」列约定）

## 调用示例

```text
/e2e-test-code-gen

评审 CSV：outputs/registry-center_Agent注册特性级集成测试用例.csv
目标仓库：openan/registry-center（本地路径 C:\...\registry-center）
范围：全部 FIT 用例 + P0/P1 DFX 用例
```

```text
/e2e-test-code-gen

从 outputs/registry-center_Agent注册特性级集成测试用例.csv 仅为 FIT-registry-center-task-dispatch-001 生成代码
目标仓库：openan/orchestration-center（互调用例按测试落地方生成）
```

## 执行指令（模型）

1. 运行 `parse-test-cases.mjs` 校验 CSV 表头（16 列）并获取解析结果（备注编排键已自动解析）；表头不符 → STOP
2. 核对编排输入（编排设计指导 §3），缺失 → STOP 列清单
3. 按 `language_profile` 分组；逐组 Read 对应 profile 文件
4. 生成 `tests/README.md`（模板 + 编排指导）→ 等用户确认
5. 按代码生成指导逐条生成测试代码；运行最小验证命令
6. 交付摘要（映射表 + 运行命令 + 跳过行说明）
