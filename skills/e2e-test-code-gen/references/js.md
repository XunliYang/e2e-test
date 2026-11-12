# JS/TS Profile（Vitest + Playwright）

适用仓库：`openan-portal`、`openan-demo`

## 技术栈

- 单测/组件测试：**Vitest**（仓库已内置，沿用根 `vitest.config.js`）
- E2E（portal 页面）：**Playwright**
- API Mock：**MSW**（Mock Service Worker）或 Playwright `page.route`
- 构建：npm monorepo（`packages/*`），测试脚本统一挂根 `package.json`

## 目录结构约定

```text
packages/<pkg>/src/**/*.test.ts       # 单元/组件测试（与被测代码同目录或 tests/ 子目录）
tests/e2e/                            # Playwright 用例（portal 仓库根级 tests/ 既有目录）
tests/fixtures/                       # 测试数据与 MSW handlers
playwright.config.ts                  # E2E 配置（baseURL 走环境变量）
```

## 命名与标记

- 单测文件：`*.test.ts`，用例 `should <expected outcome> when <condition>`
- Playwright：`e2e/<feature>.spec.ts`，用例 ID 写在 `test.describe` 或 `test()` 标题中，如 `test("FIT-marketplace-agentcard-001: 登录后展示 Agent 市场", ...)`
- 用例标题统一英文短句，报告展示更友好

## 关键模式

```ts
// Vitest + MSW 组件测试
import { setupServer } from 'msw/node'
const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

```ts
// Playwright E2E
import { test, expect } from '@playwright/test'
test('FIT-marketplace-agentcard-001: 登录后展示 Agent 市场', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: 'Agent Market' })).toBeVisible()
})
```

- portal 后端地址走 `PLAYWRIGHT_BASE_URL` / `PORTAL_API_BASE`，禁止硬编码
- 截图与 trace 在失败时保留：`playwright.config.ts` 中 `use: { screenshot: 'only-on-failure', trace: 'retain-on-failure' }`

## 运行命令

```bash
npm run test               # Vitest
npx playwright test        # E2E
npx playwright test --grep "FIT-marketplace-agentcard-001"
npx playwright show-report
```

## 生成后最小验证

```bash
npx vitest run --reporter=dot   # 至少无收集错误
```
