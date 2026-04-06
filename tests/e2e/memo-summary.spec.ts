import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Memo summary', () => {
  test('renders title with memo name', async ({ memoSummaryPage }) => {
    await memoSummaryPage.goto(1)
    await expect(memoSummaryPage.title).toBeVisible({ timeout: 10_000 })
    await expect(memoSummaryPage.title).toContainText('Memo')
  })

  test('shows summary statistics', async ({ memoSummaryPage }) => {
    await memoSummaryPage.goto(1)
    await expect(memoSummaryPage.totalDebitStat).toBeVisible({ timeout: 10_000 })
    await expect(memoSummaryPage.txCountStat).toBeVisible()
  })

  test('shows edit link', async ({ memoSummaryPage }) => {
    await memoSummaryPage.goto(1)
    await expect(memoSummaryPage.title).toBeVisible({ timeout: 10_000 })
    await expect(memoSummaryPage.editLink).toBeVisible()
  })

  test('edit link navigates to memo edit page', async ({ memoSummaryPage, page }) => {
    await memoSummaryPage.goto(1)
    await expect(memoSummaryPage.editLink).toBeVisible({ timeout: 10_000 })
    await memoSummaryPage.editLink.click()
    await expect(page).toHaveURL(/\/memos\/1\/edit/)
  })
})
