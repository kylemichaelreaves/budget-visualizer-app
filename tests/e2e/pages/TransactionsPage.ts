import type { Locator, Page } from '@playwright/test'

export class TransactionsPage {
  readonly page: Page

  /** Filter controls */
  readonly filtersSection: Locator
  readonly yearSelect: Locator
  readonly monthSelect: Locator
  readonly weekSelect: Locator
  readonly daySelect: Locator
  readonly clearButton: Locator

  /** Inline clear buttons inside each select */
  readonly yearClearButton: Locator
  readonly monthClearButton: Locator
  readonly weekClearButton: Locator
  readonly dayClearButton: Locator

  /** Period header */
  readonly periodHeader: Locator
  readonly periodLabel: Locator
  readonly prevPeriodButton: Locator
  readonly nextPeriodButton: Locator

  /** Summary stats */
  readonly summaryCreditsCard: Locator
  readonly summaryDebitsCard: Locator
  readonly summaryCategoriesCard: Locator

  /** Category assignment dialog */
  readonly categoryTreeSelectDialog: Locator
  readonly categoryTreeSearch: Locator

  /** Active budget category filter chip (after clicking a row pill) */
  readonly budgetCategoryFilterChip: Locator

  /** Backward-compat alias */
  readonly clearTimeframeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.filtersSection = page.getByTestId('transactions-table-selects')
    this.yearSelect = this.filtersSection.getByLabel('Year')
    this.monthSelect = this.filtersSection.getByLabel('Month')
    this.weekSelect = this.filtersSection.getByLabel('Week')
    this.daySelect = this.filtersSection.getByLabel('Day')
    this.clearButton = this.filtersSection.getByTestId('transactions-table-selects-clear-timeframe')

    this.yearClearButton = this.filtersSection.getByTestId('transactions-table-selects-year-clear')
    this.monthClearButton = this.filtersSection.getByTestId('transactions-table-selects-month-clear')
    this.weekClearButton = this.filtersSection.getByTestId('transactions-table-selects-week-clear')
    this.dayClearButton = this.filtersSection.getByTestId('transactions-table-selects-day-clear')

    this.periodHeader = page.getByTestId('period-header')
    this.periodLabel = page.getByTestId('period-header-label')
    this.prevPeriodButton = page.getByTestId('period-header-prev')
    this.nextPeriodButton = page.getByTestId('period-header-next')

    this.summaryCreditsCard = page.getByTestId('summary-credits-card')
    this.summaryDebitsCard = page.getByTestId('summary-debits-card')
    this.summaryCategoriesCard = page.getByTestId('summary-categories-card')

    this.categoryTreeSelectDialog = page.getByTestId('category-tree-select-dialog')
    this.categoryTreeSearch = page.getByTestId('category-tree-search')
    this.budgetCategoryFilterChip = this.filtersSection.getByTestId(
      'transactions-table-selects-budget-category-chip',
    )

    // backward compat
    this.clearTimeframeButton = this.clearButton
  }

  async goto() {
    await this.page.goto('/budget-visualizer/transactions')
  }

  async selectYear(year: string) {
    await this.yearSelect.selectOption(year)
  }

  async selectMonth(month: string) {
    await this.monthSelect.selectOption(month)
  }

  async selectWeek(week: string) {
    await this.weekSelect.selectOption(week)
  }

  async selectDay(day: string) {
    await this.daySelect.selectOption(day)
  }

  async clearYear() {
    await this.yearClearButton.click()
  }

  async clearMonth() {
    await this.monthClearButton.click()
  }

  async clearWeek() {
    await this.weekClearButton.click()
  }

  async clearDay() {
    await this.dayClearButton.click()
  }

  async clearFilters() {
    await this.clearButton.click()
  }

  async clickPrevPeriod() {
    await this.prevPeriodButton.click()
  }

  async clickNextPeriod() {
    await this.nextPeriodButton.click()
  }

  assignCategoryButton(transactionId: number | string): Locator {
    return this.page.getByTestId(`assign-category-${transactionId}`)
  }

  categoryBadge(transactionId: number | string): Locator {
    return this.page.getByTestId(`category-badge-${transactionId}`)
  }

  transactionRow(transactionId: number | string): Locator {
    return this.page.getByTestId(`transaction-row-${transactionId}`)
  }

  splitButton(transactionId: number | string): Locator {
    return this.page.getByTestId(`split-button-${transactionId}`)
  }

  memoAmbiguityIndicator(transactionId: number | string): Locator {
    return this.page.getByTestId(`memo-ambiguity-${transactionId}`)
  }

  async clickSplit(transactionId: number | string) {
    await this.splitButton(transactionId).click()
  }
}
