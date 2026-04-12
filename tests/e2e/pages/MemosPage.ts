import type { Locator, Page } from '@playwright/test'

export class MemosPage {
  readonly page: Page
  readonly heading: Locator
  readonly table: Locator
  readonly skeleton: Locator
  readonly emptyMessage: Locator
  readonly errorAlert: Locator
  readonly searchInput: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: 'Memos', exact: true })
    this.table = page.getByTestId('memos-table')
    this.skeleton = page.getByTestId('memos-table-skeleton')
    this.emptyMessage = page.getByText('No memos found.')
    this.errorAlert = page.getByTestId('memos-table-error-alert')
    this.searchInput = page.getByTestId('memos-search-input')
  }

  async goto() {
    await this.page.goto('/budget-visualizer/memos')
  }

  async search(query: string) {
    await this.searchInput.fill(query)
  }

  memoNameLink(memoId: number): Locator {
    return this.page.getByTestId(`memo-name-link-${memoId}`)
  }

  ambiguousToggle(memoId: number): Locator {
    return this.page.getByTestId(`ambiguous-toggle-${memoId}`)
  }

  categoryBadge(memoId: number): Locator {
    return this.page.getByTestId(`category-badge-${memoId}`)
  }

  assignCategoryButton(memoId: number): Locator {
    return this.page.getByTestId(`assign-category-${memoId}`)
  }

  columnHeader(key: string): Locator {
    return this.page.getByTestId(`column-${key}`)
  }

  cell(memoId: number, column: string): Locator {
    return this.page.getByTestId(`cell-${memoId}-${column}`)
  }

  /** @deprecated Use memoNameLink instead */
  memoLink(memoId: number) {
    return this.memoNameLink(memoId)
  }

  /** @deprecated No longer rendered in the new design */
  summaryLink(memoId: number) {
    return this.page.getByTestId(`memo-summary-link-${memoId}`)
  }

  /** @deprecated No longer rendered in the new design */
  editLink(memoId: number) {
    return this.page.getByTestId(`memo-edit-link-${memoId}`)
  }
}
