# Python Profile（pytest）

适用仓库：`registry-center`、`orchestration-center`、`a2a-t-sdk-python`、`workflow-engine-sdk-python`

## 技术栈

- 测试框架：**pytest** + **pytest-asyncio**（A2A-T / registry / orchestration 均为异步服务，异步用例必须使用该插件）
- HTTP 测试客户端：**httpx**（ASGI transport 可直连 FastAPI 应用做进程内集成测试，无需起服务）
- Mock：pytest 内建 `monkeypatch` + `unittest.mock.AsyncMock`
- 覆盖率：**pytest-cov**，门槛 80%
- 环境/依赖管理：**uv**（沿用目标仓库 `pyproject.toml`，不新建依赖管理文件）

## 目录结构约定

```text
tests/
├── conftest.py              # 全局 fixtures：客户端、临时存储、env 预设
├── unit/                    # 纯函数与单类测试（无 I/O）
├── integration/             # 进程内集成测试（httpx ASGI transport）
└── e2e/                     # 真实 HTTP 服务测试（需先启动被测服务）
```

## 命名与标记

- 文件：`test_<module>_<scenario>.py`
- 用例：`test_<action>_<expected_outcome>`
- 标记：`@pytest.mark.unit` / `@pytest.mark.integration` / `@pytest.mark.e2e`，用例 ID 写入 docstring 首行，如 `"""FIT-RC-001: 注册合法 Agent 成功"""`

## 关键模式

```python
# conftest.py 中提供进程内客户端（integration 层默认方式）
import httpx
import pytest

@pytest.fixture
async def client(monkeypatch):
    monkeypatch.setenv("REGISTRY_STORE", ":memory:")
    from registry_center.app import create_app
    transport = httpx.ASGITransport(app=create_app())
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
```

```python
# 异步用例
@pytest.mark.integration
@pytest.mark.asyncio
async def test_register_agent_success(client):
    """FIT-RC-001: 注册合法 Agent 成功"""
    resp = await client.post("/v1/agents", json={"name": "fault-mgmt-agent"})
    assert resp.status_code == 201
```

- e2e 层通过环境变量 `REGISTRY_CENTER_URL` 连接已启动服务，跳过条件：`pytest.mark.skipif(not os.getenv("REGISTRY_CENTER_URL"), ...)`
- 数据驱动：`@pytest.mark.parametrize`，数据放 `tests/assets/`

## 运行命令

```bash
uv run pytest tests/unit -m unit -q                    # 单测
uv run pytest tests/integration -m integration -q      # 集成
uv run pytest tests/e2e -m e2e -q                      # e2e（需服务已启动）
uv run pytest --cov=src --cov-fail-under=80            # 带覆盖率
```

## 生成后最小验证

```bash
uv run pytest --collect-only -q   # 必须全部可被发现
uv run ruff check tests/          # lint 通过
```
