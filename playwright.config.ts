import { defineConfig, devices } from '@playwright/test'

// TASK-32: E2Eシナリオ(国内購入・業務一巡)をステージング環境に対して実行する。
// PLAYWRIGHT_BASE_URLでステージングURL(docs/vercel-deploy.md参照)を指定すること。
// 未設定時はローカル開発サーバー(next dev)を想定する。
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
