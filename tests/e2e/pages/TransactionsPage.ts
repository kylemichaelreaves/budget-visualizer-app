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

  /** Period header */
  readonly periodHeader: Locator
  readonly periodLabel: Locator
  readonly prevPeriodButton: Locator
  readonly nextPeriodButton: Locator

  /** Summary stats */
  readonly summaryCreditsCard: Locator
  readonly summaryDebitsCard: Locator
  readonly summaryCategoriesCard: Locator

  /** Backward-compat alias */
  readonly clearTimeframeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.filtersSection = page.getByTestId('transactions-table-selects')
    this.yearSelect = this.filtersSection.getByLabel('Year')
    this.monthSelect = this.filtersSection.getByLabel('Month')
    this.weekSelect = this.filtersSection.getByLabel('Week')
    this.daySelect = this.filtersSection.getByLabel('Day')
    this.clearButton = this.filtersSection.getByRole('button', { name: 'Clear' })

    this.periodHeader = page.getByTestId('period-header')
    this.periodLabel = page.getByTestId('period-header-label')
    this.prevPeriodButton = page.getByTestId('period-header-prev')
    this.nextPeriodButton = page.getByTestId('period-header-next')

    this.summaryCreditsCard = page.getByTestId('summary-credits-card')
    this.summaryDebitsCard = page.getByTestId('summary-debits-card')
    this.summaryCategoriesCard = page.getByTestId('summary-categories-card')

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

  async clearFilters() {
    await this.clearButton.click()
  }

  async clickPrevPeriod() {
    await this.prevPeriodButton.click()
  }

  async clickNextPeriod() {
    await this.nextPeriodButton.click()
  }
}
