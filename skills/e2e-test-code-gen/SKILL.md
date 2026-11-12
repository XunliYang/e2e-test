---
name: e2e-test-code-gen
description: 根据评审后的 openan 测试用例 CSV（12 列，含 language_profile/component_deps/protocol_primitive 三列）与编排输入，先为目标仓库测试包生成架构规划与执行方案（tests/README.md），经用户确认后再生成可执行测试代码（Python pytest / Java JUnit5 / JS Vitest+Playwright / Shell bats），映射到目标仓 tests/ 或语言约定目录；编排输入不足时 STOP 并列出缺失项。用户要求生成 E2E 测试代码、做自动化测试代码生成，或把 CSV 转成可执行测试，以及运行 /e2e-test-code-gen 时使用。
---

# E2E Test Code Gen

将**评审通过的测试用例 CSV**（openan 12 列模板，由 test-cases-generator / test-cases-reviewer 产出）转换为**目标仓库**内可执行的自动化测试代码。

## 输入：评审用例 CSV（12 列）

```csv
case_id,type,module,title,precondition,steps,expected_result,priority,language_profile,component_deps,protocol_primitive,notes
```

样例见 [references/评审CSV样例.csv](references/评审CSV样例.csv)；模板唯一事实来源为 `../test-cases-generator/templates/case-template.csv`。

| 列 | 用途 |
|----|------|
| `case_id` | 写入测试用例标识（pytest docstring 首行 / JUnit `@DisplayName` / Playwright `test()` 标题 / bats `@test` 名），保证失败可回溯 CSV |
| `module` | 决定测试文件归属模块与文件命名分组 |
| `title` | 测试描述主体（自然语言，不加 case_id 前缀） |
| `type` | FIT 或 DFX 简写（DFT/DFD/…/DFC）；DFX 用例生成时断言必须落到日志/指标/health 等非功能观测点 |
| `language_profile` | **决定目标语言 profile**（python/java/js/shell）；逐条读取，允许一份 CSV 混合多种 profile（如跨组件互调用例按测试落地方标注） |
| `component_deps` | 跨组件用例编排依赖清单（docker compose 服务拓扑、启动顺序） |
| `protocol_primitive` | A2A-T 四原语（Task-T/Notification-T/Negotiation-T/Authorization-T）或 none；协议用例须用对应 SDK/客户端编排，不得自造协议行为 |
| `precondition` / `notes` | 准备逻辑、故障注入（重启容器、断网、错误凭据等）；notes 中 `里程碑:vX.Y` 写入用例元数据 |
| `steps` / `expected_result` | 操作步骤与断言；步骤中 `见结果N` 对应断言编号 |

**STOP**：CSV 表头不符合上述 12 列（剥离 BOM 后比对）时，提示用户先经 test-cases-reviewer 评审修正，不得凭空生成。

**跳过规则**：`type` 不在 `FIT`/`DFT`/`DFD`/`DFS`/`DFR`/`DFP`/`DFNS`/`DFC` 范围内的行跳过并在报告中列出；`case_id` 为空的行跳过。

## 编排门禁（README 先行）

仅凭 CSV 不足以生成可执行代码，还须具备包级编排输入；缺失时 **STOP 并逐项列出缺失项**，不得凭空编造。生成代码前先产出目标仓 `tests/README.md`（架构规划与执行方案），**经用户确认后**才进入代码生成。详见 [references/测试包编排设计指导.md](references/测试包编排设计指导.md)。

## 语言 Profile 决策

1. **逐条直读 CSV `language_profile` 列**（生成侧已必填），按值分组生成；`language_profile` 缺失或非法时 STOP 并列出所在行
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
- 每个测试文件头部注明来源 CSV 路径与 case_id 列表，便于失败回溯

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
node scripts/parse-test-cases.mjs <csv-path> [--ids FIT-RC-001,FIT-RC-002] [--priority P0,P1]
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

- [ ] CSV 表头 12 列校验通过；跳过行已在报告列出
- [ ] 每行 `language_profile` 合法；分组生成，每组均读过对应 profile 文件
- [ ] README 先行且经用户确认；环境变量契约完整、无硬编码秘密
- [ ] 每个测试含 case_id 标识；DFX 用例断言落在非功能观测点；协议用例使用对应原语
- [ ] 最小验证命令通过；交付含用例 ID ↔ 文件映射表

## 调用示例

```text
/e2e-test-code-gen

评审 CSV：outputs/registry-center_Agent注册特性级集成测试用例.csv
目标仓库：openan/registry-center（本地路径 C:\...\registry-center）
范围：全部 FIT 用例 + P0/P1 DFX 用例
```

```text
/e2e-test-code-gen

从 outputs/registry-center_Agent注册特性级集成测试用例.csv 仅为 FIT-RC-012 生成代码
目标仓库：openan/orchestration-center（互调用例按测试落地方生成）
```

## 执行指令（模型）

1. 运行 `parse-test-cases.mjs` 校验 CSV 表头（12 列）并获取解析结果；表头不符 → STOP
2. 核对编排输入（编排设计指导 §3），缺失 → STOP 列清单
3. 按 `language_profile` 分组；逐组 Read 对应 profile 文件
4. 生成 `tests/README.md`（模板 + 编排指导）→ 等用户确认
5. 按代码生成指导逐条生成测试代码；运行最小验证命令
6. 交付摘要（映射表 + 运行命令 + 跳过行说明）
