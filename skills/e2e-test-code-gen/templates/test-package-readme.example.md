# <module> 自动化测试

本目录为 <目标仓库> `<module>` 模块的自动化测试包（<profile：pytest / JUnit5 / Vitest+Playwright / bats>），验证 <一句话核心价值>。

> 说明：<unit / integration / e2e 分层边界（如有）>

## 测试范围

| 用例编号 | 验证内容 | 类型 | 优先级 | 状态 |
| --- | --- | --- | --- | --- |
| <FIT-registry-center-agentcard-001> | <一句话验证点> | 功能测试 | P0 | ✅ 稳定 |

### 按测试文件分类（多文件时）

| 文件 | 覆盖用例编号 | 说明 |
| --- | --- | --- |
| `<test_xxx.py / XxxTest.java / xxx.spec.ts / xxx.bats>` | <编号列表> | <职责> |

## 目录结构

按所用 profile 的目录约定（见 `references/<profile>.md`）：

```text
tests/
├── <按 profile 约定>           # 测试源码（文件头注明来源 CSV 与用例编号）
├── fixtures/ 或 assets/        # 测试数据（互操作样本用 a2a-t-corpus 既有目录）
└── README.md                   # 本文件
```

## fixtures / 测试数据

1. <fixture 名称与用途；如 compose 启动的服务实例、内存客户端>
2. <数据文件位置与加载方式>

## 环境变量

优先从 `.env` 加载（参考 `.env.template`；禁止写入真实密码/token）：

```bash
# <变量用途分组>
<KEY_1>=<示例值>
<KEY_2>=<示例值>
```

| 变量 | 用途 | 缺省行为 |
| --- | --- | --- |
| `<KEY_1>` | <用途> | <跳过 / 复用其它变量 / 报错> |

## 跨组件拓扑（component_deps ≠ none 时）

| 服务 | 来源 | 启动方式 | 端口 |
| --- | --- | --- | --- |
| <orchestration-center> | <openan/orchestration-center> | `docker compose up -d`（<compose 文件路径>） | <port> |

启动顺序与等待就绪条件：<说明>

## 套件生命周期

setup 阶段：

1. <compose up / 临时目录 / 内存存储初始化>
2. <等待就绪：health 端点轮询等>

teardown 阶段：

- <compose down / 临时目录清理>

## 运行方式

在目标仓库根目录执行（按 profile，详见 `references/<profile>.md`）：

```bash
# 全部
<profile 运行命令>

# 按用例编号过滤
<profile 过滤命令，如 pytest -k / --grep / -Dtest>

# 按执行策略过滤（备注 执行策略 键 smoke/full/slow 已映射为标记）
<如 pytest -m smoke / npx playwright test --grep @smoke>
```

最小验证（交付前必过）：<collect-only / test-compile / vitest run / bats --count 命令>

## 已知限制（可选）

1. <skip 条件：服务未启动、e2e 层缺环境变量时自动跳过等>
