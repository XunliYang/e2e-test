# openan-itest

OpenAN 集成测试仓库：测试方案、用例、代码与报告的归档与执行仓库。规范基线为《OpenAN Integration Testing Process and Framework》（见 `../docs/OpenAN Integration Testing Process and Framework.md`）。

## 目录结构

```
openan-itest/
├── e2e/                              # 后端集成测试（pytest）
│   ├── framework/                    # 共享能力：K8s client、env 加载、工具函数
│   ├── <feature>/                    # 每特性一个目录（如 registry-center、orchestration-center）
│   │   ├── test_<feature>_api.py
│   │   ├── test_<topic>.py
│   │   ├── system-integration/       # 该特性的系统级集成用例
│   │   │   └── test_<scenario>.py
│   │   └── utils/  static/
│   └── .env.template                 # 环境变量契约模板（仓库仅存模板，禁止提交 .env）
├── e2e-frontend/                     # 前端 UI 自动化（Playwright，可选）
├── testcases/functional/integration/ # pytest 遗留栈（按需保留）
├── docs/
│   ├── templates/                    # 测试方案/用例表/测试报告模板
│   ├── plans/<version>/              # 测试方案归档
│   └── reports/<version>/            # 测试报告归档
└── README.md
```

## 用例命名与标签

- 用例编号：`FIT-<feature>-<topic>-<number>`（如 `FIT-orchestration-workflow-001`）；SIT 用例：`SIT-<scenario>-<number>`
- 测试文件：`test_<topic>.py`；测试函数：`test_<action>_<expected_result>`；Playwright：`test-<scenario>.spec.ts`
- 标签维度（pytest marker，每个用例必打）：

| 维度 | 示例 | 说明 |
|------|------|------|
| feature | `registry-center`、`orchestration-center` | 特性标识 |
| environment | `with-workload-cluster`、`online`、`offline` | CI 环境过滤 |
| components | `registry-center`、`openan-portal` | 被测组件 |
| priority | `P0`、`P1`、`P2` | 用例优先级 |
| execution | `smoke`、`full`、`slow` | PR CI 跑 `smoke`，Daily 跑 `full` |
| skip | `skip-temporarily` | 临时跳过，必须引用 issue 链接 |

## 运行方式

```bash
cp e2e/.env.template e2e/.env   # 填入真实环境值
cd e2e && pytest <feature>/ -m "not slow"
```

CI 触发策略：PR 跑受影响特性目录的 `smoke`；Daily 跑全量 `full` + SIT smoke；RC 触发全量 FIT+SIT 并启动长稳；预发布在 RC 上重跑全部 P0/P1 与 SIT。

## 安全红线

- 仓库仅保留 `.env.template`；**禁止提交 `.env`、真实凭据、IP、token**
- Code Review 发现硬编码密钥/内网地址一律拒绝合入
