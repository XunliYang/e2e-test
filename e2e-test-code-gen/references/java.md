# Java Profile（JUnit5）

适用仓库：`a2a-t-sdk-java`、`workflow-engine-sdk-java`

## 技术栈

- 测试框架：**JUnit 5**（Jupiter）+ **AssertJ**（断言风格统一）
- Mock：**Mockito**（含 `mockito-inline` 静态 Mock）
- HTTP/JSON-RPC 交互测试：**WireMock**（模拟对端 Agent / Registry，A2A-T 的 JSON-RPC over HTTP 场景首选）
- 构建：Maven（沿用根 `pom.xml` 多模块结构，测试放对应模块 `src/test/java`）
- 覆盖率：JaCoCo + `mvn verify` 门槛由根 pom 控制，不另起配置

## 目录结构约定

```text
<module>/src/test/java/com/openan/a2at/<area>/
├── unit/          // 纯逻辑测试
├── contract/      // JSON-RPC / AgentCard 协议契约测试（WireMock）
└── integration/   // 多组件组装测试
<module>/src/test/resources/
└── wiremock/      // WireMock 映射文件（__files / mappings）
```

## 命名与标记

- 类：`_<Scenario>Test`（unit）/ `_<Protocol>ContractTest`（contract）/ `_<Flow>IT`（integration，Failsafe 接管）
- 方法：`should_<expected>_<when_condition>`
- 用例 ID 写在 `@DisplayName` 中，如 `@DisplayName("FIT-A2A-003: Negotiation-T 拒绝越权操作")`

## 关键模式

```java
@WireMockTest
class TaskTSubmitContractTest {

    @Test
    @DisplayName("FIT-A2A-001: Task-T 提交返回结构化任务定义")
    void should_return_structured_task_when_submit_valid_task(WireMockRuntimeInfo wm) {
        stubFor(post("/jsonrpc")
            .willReturn(okJson("""
                {"jsonrpc":"2.0","id":1,
                 "result":{"taskId":"t-001","status":"SUBMITTED"}}
                """)));
        var client = A2ATClient.builder().endpoint(wm.getHttpBaseUrl()).build();
        var task = client.submitTask(validTaskT());
        assertThat(task.getTaskId()).isEqualTo("t-001");
    }
}
```

- 互操作测试注意：与 Python SDK 对跑时，协议样本数据放 `a2a-t-corpus` 既有目录，禁止在两份 SDK 中各自维护样本

## 运行命令

```bash
mvn test                           # 单测 + 契约（Surefire）
mvn verify                         # 追加 integration（Failsafe）
mvn test -Dtest=TaskTSubmitContractTest
```

## 生成后最小验证

```bash
mvn -q test-compile   # 测试代码必须可编译
```
