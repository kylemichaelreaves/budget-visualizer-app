import { test, expect } from './fixtures/fixtures'
import { authenticatedTest } from './fixtures/fixtures'
import { installApiMocks } from './fixtures/install-api-mocks'

test.describe('Login flow (unauthenticated)', () => {
  test('successful login redirects to transactions', async ({ page, loginPage }) => {
    await installApiMocks(page)
    await loginPage.goto()
    await loginPage.login('testuser', 'testpass')
    await expect(page).toHaveURL(/\/budget-visualizer\/transactions/, { timeout: 10_000 })
  })

  test('login with redirect param lands on correct page', async ({ page, loginPage }) => {
    await installApiMocks(page)
    await page.goto('/login?redirect=%2Fbudget-visualizer%2Fmemos')
    await loginPage.login('testuser', 'testpass')
    await expect(page).toHaveURL(/\/budget-visualizer\/memos/, { timeout: 10_000 })
  })

  test('failed login shows error alert', async ({ page, loginPage }) => {
    // Return a 403 (not 401, which triggers the global onUnauthorized redirect)
    await page.route(/\/api\/v1\/login/, async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid credentials' }),
      })
    })
    await loginPage.goto()
    await loginPage.login('bad', 'creds')
    await expect(loginPage.errorAlert).toBeVisible({ timeout: 5_000 })
  })
})

authenticatedTest.describe('Auth guard', () => {
  authenticatedTest('authenticated user can access budget visualizer', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
  })
})
