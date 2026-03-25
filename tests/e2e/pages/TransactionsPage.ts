import type { Locator, Page } from '@playwright/test'

export class TransactionsPage {
  readonly page: Page

  /** Filter controls */
  readonly filtersSection: Locator
  readonly yearSelect: Locator
  readonly monthSelect: Locator
  readonly weekSelect: Locator
  readonly daySelect: Locator
  readonly memoInput: Locator
  readonly memoApplyButton: Locator
  readonly clearTimeframeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.filtersSection = page.getByTestId('transactions-table-selects')
    this.yearSelect = this.filtersSection.getByLabel('Year')
    this.monthSelect = this.filtersSection.getByLabel('Month')
    this.weekSelect = this.filtersSection.getByLabel('Week')
    this.daySelect = this.filtersSection.getByLabel('Day')
    this.memoInput = this.filtersSection.getByPlaceholder('Memo id or name')
    this.memoApplyButton = this.filtersSection.getByRole('button', { name: 'Apply' })
    this.clearTimeframeButton = this.filtersSection.getByRole('button', { name: 'Clear timeframe' })
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

  async filterByMemo(memo: string) {
    await this.memoInput.fill(memo)
    await this.memoApplyButton.click()
  }

  async clearFilters() {
    await this.clearTimeframeButton.click()
  }
}
