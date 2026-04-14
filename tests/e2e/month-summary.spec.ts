import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Month summary table', () => {
  test('renders on month summary route with data and memo link', async ({ monthSummaryTablePage }) => {
    await monthSummaryTablePage.gotoForMonth('01-2025')
    await expect(monthSummaryTablePage.root).toBeVisible({ timeout: 30_000 })
    await expect(monthSummaryTablePage.root.getByRole('heading', { name: /Month summary/ })).toBeVisible()
    await expect(monthSummaryTablePage.dataTable()).toBeVisible()
    await expect(
      monthSummaryTablePage.dataTable().getByRole('columnheader', { name: 'Total debit' }),
    ).toBeVisible()
    await expect(
      monthSummaryTablePage.dataTable().getByRole('cell', { name: 'Food - Groceries' }),
    ).toBeVisible()

    const link = monthSummaryTablePage.memoLinkForNumericMemo(42)
    await expect(link).toBeVisible()
    await link.click()
    await expect(monthSummaryTablePage.page).toHaveURL(/\/memos\/42\/summary/)
  })

  test('appears when selecting a month on the main transactions page', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectMonth('01-2025')
    await expect(transactionsPage.page.getByTestId('month-summary-table')).toBeVisible({ timeout: 30_000 })
    await expect(
      transactionsPage.page
        .getByTestId('month-summary-table')
        .getByRole('heading', { name: /Month summary/ }),
    ).toBeVisible()
  })
})
