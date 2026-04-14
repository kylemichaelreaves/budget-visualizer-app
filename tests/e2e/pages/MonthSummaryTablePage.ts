import type { Locator, Page } from '@playwright/test'

/** POM for the month timeframe summary table on `/budget-visualizer/transactions/months/:month/summary`. */
export class MonthSummaryTablePage {
  readonly page: Page
  readonly root: Locator
  readonly errorAlert: Locator
  readonly loadingMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('month-summary-table')
    this.errorAlert = page.getByTestId('month-summary-table-error')
    this.loadingMessage = page.getByText('Loading month summary...')
  }

  async gotoForMonth(month: string) {
    const encoded = encodeURIComponent(month)
    await this.page.goto(`/budget-visualizer/transactions/months/${encoded}/summary`)
  }

  dataTable(): Locator {
    return this.root.locator('table')
  }

  memoLinkForNumericMemo(memoId: number): Locator {
    return this.page.getByTestId('month-summary-memo-link').filter({ hasText: new RegExp(`^${memoId}$`) })
  }
}
