import type { Locator, Page } from '@playwright/test'

export class MemosPage {
  readonly page: Page
  readonly heading: Locator
  readonly table: Locator
  readonly skeleton: Locator
  readonly emptyMessage: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /memos/i })
    this.table = page.getByTestId('memos-table')
    this.skeleton = page.getByTestId('memos-table-skeleton')
    this.emptyMessage = page.getByText('No memos found.')
    this.errorAlert = page.getByTestId('memos-table-error-alert')
  }

  async goto() {
    await this.page.goto('/budget-visualizer/memos')
  }

  memoLink(memoId: number) {
    return this.table.getByRole('link', { name: String(memoId) })
  }

  summaryLink(memoId: number) {
    return this.page.getByTestId(`memo-summary-link-${memoId}`)
  }

  editLink(memoId: number) {
    return this.page.getByTestId(`memo-edit-link-${memoId}`)
  }
}
