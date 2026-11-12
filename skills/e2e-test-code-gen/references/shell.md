# Shell Profile（bats-core）

适用仓库：`openan-installation`

## 技术栈

- 测试框架：**bats-core**（外加 `bats-support` / `bats-assert` 断言库）
- 静态检查：**shellcheck**、**shfmt**（测试代码与目标脚本同等要求）
- 环境隔离：测试在 `mktemp -d` 临时目录中进行，禁止污染真实 `$HOME` / `/usr/local`
- 涉及容器化的场景（`containerized/`）：docker 可用时执行，否则 `skip`（bats `skip "docker not available"`）

## 目录结构约定

```text
tests/
├── <script_name>.bats          # 与 binary/、containerized/ 下被测脚本对应
├── helpers/
│   ├── setup.bash              # 通用 setup：临时目录、PATH 预设、清理
│   └── fixtures/               # 假二进制、假配置
└── shellcheck.sh               # shellcheck 全量扫描入口
```

## 命名与约定

- 用例：`@test "<script>: <action> <expected outcome>"`，用例 ID 放最前，如 `@test "DFX-ofpower-install-invalid-input-001: installer 缺参数时打印用法并退出 1"`
- 每个用例独立 setup/teardown，不依赖执行顺序
- 被测脚本以绝对路径调用（`"$BATS_TEST_DIRNAME/../../binary/installer.sh"`），不 `cd` 进被测目录

## 关键模式

```bash
#!/usr/bin/env bats
load helpers/setup

@test "DFX-ofpower-install-invalid-input-001: installer 缺参数时打印用法并退出 1" {
    run "$BATS_TEST_DIRNAME/../../binary/installer.sh"
    [ "$status" -eq 1 ]
    [[ "$output" == *"Usage"* ]]
}
```

```bash
# helpers/setup.bash 模式
setup() {
    TEST_TMPDIR="$(mktemp -d)"
    export HOME="$TEST_TMPDIR"   # 隔离 HOME
}
teardown() {
    rm -rf "$TEST_TMPDIR"
}
```

## 运行命令

```bash
bats tests/                          # 全部
bats tests/installer.bats            # 单文件
shellcheck binary/*.sh containerized/**/*.sh
shfmt -d .
```

## 生成后最小验证

```bash
bats --count tests/    # 用例可被发现（或 bats -l 列表）
shellcheck tests/      # 测试脚本本身通过静态检查
```
