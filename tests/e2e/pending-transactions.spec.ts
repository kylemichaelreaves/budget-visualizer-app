import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Pending transactions', () => {
  test('page renders heading and tab controls', async ({ pendingTransactionsPage }) => {
    await pendingTransactionsPage.goto()
    await expect(pendingTransactionsPage.heading).toBeVisible({ timeout: 10_000 })
    await expect(pendingTransactionsPage.pendingTab).toBeVisible()
    await expect(pendingTransactionsPage.reviewedTab).toBeVisible()
  })

  test('renders table or empty state', async ({ pendingTransactionsPage }) => {
    await pendingTransactionsPage.goto()
    await expect(pendingTransactionsPage.heading).toBeVisible({ timeout: 10_000 })
    // API mock returns empty array, so table should render with no rows
    await expect(pendingTransactionsPage.table).toBeVisible()
  })

  test('can switch between pending and reviewed tabs', async ({ pendingTransactionsPage }) => {
    await pendingTransactionsPage.goto()
    await expect(pendingTransactionsPage.heading).toBeVisible({ timeout: 10_000 })
    await pendingTransactionsPage.switchToReviewed()
    // Reviewed tab should appear active (higher opacity)
    await expect(pendingTransactionsPage.reviewedTab).toHaveCSS('opacity', '1')
    await pendingTransactionsPage.switchToPending()
    await expect(pendingTransactionsPage.pendingTab).toHaveCSS('opacity', '1')
  })
})
