import type { Locator, Page } from '@playwright/test'

export class PendingTransactionsPage {
  readonly page: Page
  readonly heading: Locator
  readonly table: Locator
  readonly skeleton: Locator
  readonly errorAlert: Locator
  readonly pendingTab: Locator
  readonly reviewedTab: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /pending transactions/i })
    this.table = page.getByTestId('pending-transactions-table')
    this.skeleton = page.getByTestId('pending-transactions-table-skeleton')
    this.errorAlert = page.getByTestId('pending-transactions-table-error-alert')
    const tablist = page.getByRole('tablist')
    this.pendingTab = tablist.getByRole('button', { name: 'Pending' })
    this.reviewedTab = tablist.getByRole('button', { name: 'Reviewed' })
  }

  async goto() {
    await this.page.goto('/budget-visualizer/transactions/pending')
  }

  async switchToReviewed() {
    await this.reviewedTab.click()
  }

  async switchToPending() {
    await this.pendingTab.click()
  }
}
