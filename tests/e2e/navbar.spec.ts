import { test, expect } from './fixtures/fixtures'
import { authenticatedTest } from './fixtures/fixtures'
import { installApiMocks } from './fixtures/install-api-mocks'

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
    await navbar.clickLoginLogout()
    await expect(page).toHaveURL(/\/login/)
  })

  test('does not show admin badge when unauthenticated', async ({ page, navbar }) => {
    await page.goto('/login')
    await expect(navbar.adminBadge).not.toBeVisible()
  })
})

authenticatedTest.describe('NavBar (authenticated)', () => {
  authenticatedTest('shows user menu button with username', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(navbar.userMenuButton).toBeVisible()
    await expect(navbar.loginLabel()).toHaveText('e2e')
  })

  authenticatedTest('brand link navigates to transactions', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/memos')
    await navbar.brandLink.click()
    await expect(page).toHaveURL(/\/budget-visualizer\/transactions/)
  })

  authenticatedTest('clicking user menu logs out and redirects', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(navbar.userMenuButton).toBeVisible()
    await navbar.clickLoginLogout()
    await expect(page).toHaveURL(/\/login/)
  })
})

authenticatedTest.describe('NavBar admin badge', () => {
  authenticatedTest.use({
    page: async ({ page }, use) => {
      const adminUser = JSON.stringify({
        id: 1,
        username: 'admin-user',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.test',
        role: 'admin',
      })
      await page.addInitScript(
        ({ user, token }: { user: string; token: string }) => {
          localStorage.setItem('user', user)
          localStorage.setItem('token', token)
        },
        { user: adminUser, token: 'admin-token' },
      )
      await installApiMocks(page)
      await use(page)
    },
  })

  authenticatedTest('shows admin badge for admin users', async ({ page, navbar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(navbar.adminBadge).toBeVisible()
    await expect(navbar.adminBadge).toHaveText('admin')
  })
})
