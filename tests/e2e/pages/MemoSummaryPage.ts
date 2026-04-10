import type { Locator, Page } from '@playwright/test'

export class MemoSummaryPage {
  readonly page: Page
  readonly title: Locator
  readonly backButton: Locator
  readonly totalCreditStat: Locator
  readonly totalDebitStat: Locator
  readonly transactionsTable: Locator
  readonly noTransactionsMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByTestId('memo-summary-title')
    this.backButton = page.getByTestId('memo-summary-back-to-list')
    this.totalCreditStat = page.getByTestId('memo-summary-total-credit')
    this.totalDebitStat = page.getByTestId('memo-summary-total-debit')
    this.transactionsTable = page.getByTestId('memo-summary-transactions-table')
    this.noTransactionsMessage = page.getByText('No transactions for this memo.')
  }

  async goto(memoId: number) {
    await this.page.goto(`/budget-visualizer/memos/${memoId}/summary`)
  }

  async goBack() {
    await this.backButton.click()
  }

  transactionEditLink(transactionId: number): Locator {
    return this.page.getByTestId(`memo-summary-tx-edit-${transactionId}`)
  }

  /** @deprecated Use backButton instead */
  get allMemosLink() {
    return this.backButton
  }

  get editLink() {
    return this.page.getByTestId('memo-summary-edit-link')
  }

  /** Summary header line showing total transaction count (from memo summary API). */
  get txCountStat() {
    return this.page.getByTestId('memo-summary-tx-count')
  }
}
