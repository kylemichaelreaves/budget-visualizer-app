import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Week summary table', () => {
  test('renders on week summary route with data and memo link', async ({ weekSummaryTablePage }) => {
    await weekSummaryTablePage.gotoForWeek('03-2025')
    await expect(weekSummaryTablePage.root).toBeVisible({ timeout: 30_000 })
    await expect(weekSummaryTablePage.root.getByRole('heading', { name: /Week summary/ })).toBeVisible()
    await expect(weekSummaryTablePage.dataTable()).toBeVisible()
    await expect(
      weekSummaryTablePage.dataTable().getByRole('columnheader', { name: 'Weekly debit' }),
    ).toBeVisible()
    await expect(weekSummaryTablePage.dataTable().getByRole('cell', { name: 'Transport' })).toBeVisible()

    const link = weekSummaryTablePage.memoLinkForNumericMemo(7)
    await expect(link).toBeVisible()
    await link.click()
    await expect(weekSummaryTablePage.page).toHaveURL(/\/memos\/7\/summary/)
  })

  test('appears when selecting a week on the main transactions page', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectWeek('03-2025')
    await expect(transactionsPage.page.getByTestId('week-summary-table')).toBeVisible({ timeout: 30_000 })
    await expect(
      transactionsPage.page.getByTestId('week-summary-table').getByRole('heading', { name: /Week summary/ }),
    ).toBeVisible()
  })
})
