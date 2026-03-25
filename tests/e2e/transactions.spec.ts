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

  test('clear timeframe button resets selects', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await transactionsPage.clearFilters()
    await expect(transactionsPage.yearSelect).toHaveValue('')
    await expect(transactionsPage.monthSelect).toHaveValue('')
    await expect(transactionsPage.weekSelect).toHaveValue('')
    await expect(transactionsPage.daySelect).toHaveValue('')
  })
})
