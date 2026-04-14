import type { Locator, Page } from '@playwright/test'

/** POM for the week timeframe summary table on `/budget-visualizer/transactions/weeks/:week/summary`. */
export class WeekSummaryTablePage {
  readonly page: Page
  readonly root: Locator
  readonly errorAlert: Locator
  readonly loadingMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('week-summary-table')
    this.errorAlert = page.getByTestId('week-summary-table-error')
    this.loadingMessage = page.getByText('Loading week summary...')
  }

  async gotoForWeek(week: string) {
    const encoded = encodeURIComponent(week)
    await this.page.goto(`/budget-visualizer/transactions/weeks/${encoded}/summary`)
  }

  dataTable(): Locator {
    return this.root.locator('table')
  }

  memoLinkForNumericMemo(memoId: number): Locator {
    return this.page.getByTestId('week-summary-memo-link').filter({ hasText: new RegExp(`^${memoId}$`) })
  }
}
