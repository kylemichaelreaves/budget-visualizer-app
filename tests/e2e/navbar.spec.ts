import { test, expect } from './fixtures/fixtures'
import { authenticatedTest } from './fixtures/fixtures'
import { E2E_ADMIN_USER } from './fixtures/auth-storage'

test.describe('NavBar (unauthenticated)', () => {
  test('shows navbar with brand link on login page', async ({ page, navbar }) => {
    await page.goto('/login')
    await expect(navbar.nav).toBeVisible()
    await expect(navbar.brandLink).toBeVisible()
  })

  test('shows "Log In" button when not authenticated', async ({ page, navbar }) => {
    await page.goto('/login')
    await expect(navbar.loginButton).toBeVisible()
    await expect(navbar.loginButton).toHaveAccessibleName(/log in/i)
  })

  test('clicking login button navigates to login page', async ({ page, navbar }) => {
    await page.goto('/login')
    await navbar.clickLogin()
    await expect(page).toHaveURL(/\/login/)
  })

  test('does not show admin badge when unauthenticated', async ({ page, navbar }) => {
    await page.goto('/login')
    await expect(navbar.adminBadge).not.toBeVisible()
  })
})

authenticatedTest.describe('NavBar (authenticated)', () => {
  authenticatedTest('shows user menu button with account actions', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(navbar.userMenuButton).toBeVisible()
    await expect(navbar.userMenuButton).toHaveAccessibleName(/account menu for e2e/i)
  })

  authenticatedTest('brand link navigates to transactions', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/memos')
    await navbar.brandLink.click()
    await expect(page).toHaveURL(/\/budget-visualizer\/transactions/)
  })

  authenticatedTest('clicking user menu logs out and redirects', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(navbar.userMenuButton).toBeVisible()
    await navbar.logout()
    await expect(page).toHaveURL(/\/login/)
  })
})

authenticatedTest.describe('NavBar admin badge', () => {
  authenticatedTest.use({ authUser: E2E_ADMIN_USER })

  authenticatedTest('shows admin badge for admin users', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(navbar.adminBadge).toBeVisible()
    await expect(navbar.adminBadge).toHaveText('admin')
  })
})
