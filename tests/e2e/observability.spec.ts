import { authenticatedTest as test, expect } from './fixtures/fixtures'
import { E2E_ADMIN_USER, E2E_AUTH_TOKEN } from './fixtures/auth-storage'
import { installApiMocks } from './fixtures/install-api-mocks'

const OBSERVABILITY_URL = '/budget-visualizer/observability'

test.describe('Observability (admin)', () => {
  test.use({
    page: async ({ page }, use) => {
      await page.addInitScript(
        ({ user, token }: { user: string; token: string }) => {
          localStorage.setItem('user', user)
          localStorage.setItem('token', token)
        },
        { user: E2E_ADMIN_USER, token: E2E_AUTH_TOKEN },
      )
      await installApiMocks(page)
      await use(page)
    },
  })

  test('shows the sidebar link and opens the page with all four cards', async ({
    page,
    sidebar,
    observabilityPage,
  }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(sidebar.observabilityLink).toBeVisible()
    await sidebar.observabilityLink.click()

    await expect(page).toHaveURL(/\/budget-visualizer\/observability/)
    await expect(observabilityPage.root).toBeVisible()
    await expect(observabilityPage.apiCard).toBeVisible()
    await expect(observabilityPage.lambdaTable).toBeVisible()
    await expect(observabilityPage.ingestionCard).toBeVisible()
    await expect(observabilityPage.rdsCard).toBeVisible()
  })

  test('switching range updates the URL and survives a reload', async ({ page, observabilityPage }) => {
    await observabilityPage.goto()
    await expect(observabilityPage.apiCard).toBeVisible()

    await observabilityPage.rangeButton('7d').click()
    await expect(page).toHaveURL(/range=7d/)
    await expect(observabilityPage.rangeButton('7d')).toHaveAttribute('data-pressed', '')

    await page.reload()
    await expect(observabilityPage.apiCard).toBeVisible()
    await expect(observabilityPage.rangeButton('7d')).toHaveAttribute('data-pressed', '')
    await expect(observabilityPage.rangeButton('24h')).not.toHaveAttribute('data-pressed', '')
  })

  test('shows the forbidden state when the API answers 403', async ({ page, observabilityPage }) => {
    await page.route(/\/api\/v1\/observability\/metrics/, (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Forbidden' }),
      }),
    )
    await observabilityPage.goto()
    await expect(observabilityPage.forbidden).toBeVisible()
    await expect(observabilityPage.forbidden).toContainText(
      "You don't have access to observability. If your role changed recently, sign out and back in.",
    )
  })

  test('renders in dark mode with the dark background', async ({ page, observabilityPage }) => {
    await observabilityPage.goto()
    await page.evaluate(() => document.documentElement.classList.add('dark'))
    await expect(observabilityPage.apiCard).toBeVisible()

    // Resolve the expected color through the browser instead of hand-writing an rgb string.
    const { actual, expected } = await page.evaluate(() => {
      const probe = document.createElement('div')
      probe.style.backgroundColor = 'oklch(0.145 0 0)'
      document.body.appendChild(probe)
      const expectedColor = getComputedStyle(probe).backgroundColor
      probe.remove()
      return { actual: getComputedStyle(document.body).backgroundColor, expected: expectedColor }
    })
    expect(actual).toBe(expected)
  })
})

test.describe('Observability (non-admin)', () => {
  test('has no sidebar link and redirects a direct visit to transactions', async ({ page, sidebar }) => {
    await page.goto('/budget-visualizer/transactions')
    await expect(sidebar.transactionsLink).toBeVisible()
    await expect(sidebar.observabilityLink).toHaveCount(0)

    await page.goto(OBSERVABILITY_URL)
    await expect(page).toHaveURL(/\/budget-visualizer\/transactions/)
  })
})
