import { defineConfig, devices } from '@playwright/test'

const port = 4173
const host = '127.0.0.1'
const baseURL = `http://${host}:${port}`

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  // API mocks are `page.route` / `context.route` handlers scoped to each test's own
  // browser context, and the preview server is static, so tests share no state and can
  // run concurrently. Hosted runners have 4 vCPUs.
  workers: process.env.CI ? 4 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // `vite build`, not `bun run build`: that script runs `tsc -b` first, repeating the
    // full typecheck the Typecheck job already gates.
    command: `bunx vite build && bun run preview -- --host ${host} --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
