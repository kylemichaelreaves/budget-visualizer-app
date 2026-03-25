import type { Locator, Page } from '@playwright/test'

export class MemoSummaryPage {
  readonly page: Page
  readonly title: Locator
  readonly editLink: Locator
  readonly allMemosLink: Locator
  readonly totalDebitStat: Locator
  readonly txCountStat: Locator
  readonly transactionsTable: Locator
  readonly noTransactionsMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.getByTestId('memo-summary-title')
    this.editLink = page.getByRole('link', { name: 'Edit memo' })
    this.allMemosLink = page.getByRole('link', { name: 'All memos' })
    this.totalDebitStat = page.getByTestId('memo-summary-total-debit')
    this.txCountStat = page.getByTestId('memo-summary-tx-count')
    this.transactionsTable = page.getByTestId('memo-summary-transactions-table')
    this.noTransactionsMessage = page.getByText('No transactions for this memo.')
  }

  async goto(memoId: number) {
    await this.page.goto(`/budget-visualizer/memos/${memoId}/summary`)
  }
}
