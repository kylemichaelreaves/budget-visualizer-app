import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Transactions (authenticated)', () => {
  test('loads transactions shell and timeframe controls', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await expect(transactionsPage.yearSelect).toBeVisible()
    await expect(transactionsPage.monthSelect).toBeVisible()
    await expect(transactionsPage.weekSelect).toBeVisible()
    await expect(transactionsPage.daySelect).toBeVisible()
  })

  test('navigates to memos via sidebar', async ({ transactionsPage, sidebar, memosPage }) => {
    await transactionsPage.goto()
    await sidebar.navigateToMemos()
    await expect(transactionsPage.page).toHaveURL(/\/budget-visualizer\/memos$/)
    await expect(memosPage.heading).toBeVisible()
  })

  test('navigates to budget categories page', async ({ transactionsPage, sidebar, budgetCategoriesPage }) => {
    await transactionsPage.goto()
    await sidebar.navigateToBudgetCategories()
    await expect(transactionsPage.page).toHaveURL(/\/budget-visualizer\/budget-categories$/)
    await expect(budgetCategoriesPage.heading).toBeVisible()
  })

  test('sidebar navigation links are visible', async ({ transactionsPage, sidebar }) => {
    await transactionsPage.goto()
    await expect(sidebar.nav).toBeVisible()
    await expect(sidebar.transactionsLink).toBeVisible()
    await expect(sidebar.pendingLink).toBeVisible()
    await expect(sidebar.memosLink).toBeVisible()
    await expect(sidebar.budgetCategoriesLink).toBeVisible()
    await expect(sidebar.loanCalculatorLink).toBeVisible()
  })

  test('period header shows default heading when no filter active', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.periodHeader).toBeVisible({ timeout: 30_000 })
    await expect(transactionsPage.periodHeader.getByRole('heading', { name: 'Transactions' })).toBeVisible()
  })

  test('summary stats cards are hidden when no filter is active', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await expect(transactionsPage.summaryCreditsCard).not.toBeVisible()
    await expect(transactionsPage.summaryDebitsCard).not.toBeVisible()
    await expect(transactionsPage.summaryCategoriesCard).not.toBeVisible()
  })

  test('clear button is hidden when no filter is active', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await expect(transactionsPage.clearButton).not.toBeVisible()
  })
})

test.describe('View mode filtering', () => {
  test('selecting a year activates year view', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectYear('2025')
    await expect(transactionsPage.periodLabel).toBeVisible()
    await expect(transactionsPage.periodLabel).toHaveText('2025')
    await expect(transactionsPage.summaryCreditsCard).toBeVisible()
    await expect(transactionsPage.summaryDebitsCard).toBeVisible()
    await expect(transactionsPage.summaryCategoriesCard).toBeVisible()
    await expect(transactionsPage.clearButton).toBeVisible()
  })

  test('selecting a month activates month view', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectMonth('01-2025')
    await expect(transactionsPage.periodLabel).toBeVisible()
    await expect(transactionsPage.periodLabel).toHaveText('January 2025')
  })

  test('selecting a new filter clears the previous one', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectMonth('01-2025')
    await expect(transactionsPage.periodLabel).toHaveText('January 2025')
    // now select a year — month should reset
    await transactionsPage.selectYear('2024')
    await expect(transactionsPage.periodLabel).toHaveText('2024')
    await expect(transactionsPage.monthSelect).toHaveValue('')
  })

  test('clear button resets all filters and hides summary stats', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectYear('2025')
    await expect(transactionsPage.summaryCreditsCard).toBeVisible()
    await transactionsPage.clearFilters()
    await expect(transactionsPage.yearSelect).toHaveValue('')
    await expect(transactionsPage.monthSelect).toHaveValue('')
    await expect(transactionsPage.weekSelect).toHaveValue('')
    await expect(transactionsPage.daySelect).toHaveValue('')
    await expect(transactionsPage.summaryCreditsCard).not.toBeVisible()
  })

  test('prev/next navigation buttons appear for year view', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectYear('2025')
    await expect(transactionsPage.prevPeriodButton).toBeVisible()
    await expect(transactionsPage.nextPeriodButton).toBeVisible()
  })

  test('prev navigates to older period, next to newer', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    // Select 2025 (newest) — Next should be disabled, Prev goes to 2024
    await transactionsPage.selectYear('2025')
    await expect(transactionsPage.periodLabel).toHaveText('2025')
    await expect(transactionsPage.nextPeriodButton).toBeDisabled()
    await expect(transactionsPage.prevPeriodButton).toBeEnabled()
    // Go to previous (older) — 2024
    await transactionsPage.clickPrevPeriod()
    await expect(transactionsPage.periodLabel).toHaveText('2024')
    // Now Prev should be disabled (oldest), Next should be enabled
    await expect(transactionsPage.prevPeriodButton).toBeDisabled()
    await expect(transactionsPage.nextPeriodButton).toBeEnabled()
  })

  test('clear button in nav group clears the active filter', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.selectYear('2025')
    await expect(transactionsPage.periodLabel).toHaveText('2025')
    await transactionsPage.page.getByTestId('period-header-clear').click()
    await expect(transactionsPage.periodLabel).not.toBeVisible()
    await expect(transactionsPage.summaryCreditsCard).not.toBeVisible()
    await expect(transactionsPage.yearSelect).toHaveValue('')
  })
})
