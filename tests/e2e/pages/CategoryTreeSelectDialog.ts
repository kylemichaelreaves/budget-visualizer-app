import type { Locator, Page } from '@playwright/test'

export class CategoryTreeSelectDialog {
  readonly page: Page
  readonly dialog: Locator
  readonly title: Locator
  readonly searchInput: Locator
  readonly closeButton: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog', { name: /assign budget category/i })
    this.title = this.dialog.locator('[data-slot="dialog-title"]')
    this.searchInput = this.dialog.getByPlaceholder('Search categories...')
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' })
  }

  async waitForOpen() {
    await this.dialog.waitFor({ state: 'visible' })
  }

  async waitForClosed() {
    await this.dialog.waitFor({ state: 'hidden' })
  }

  async search(query: string) {
    await this.searchInput.fill(query)
  }

  async clearSearch() {
    await this.searchInput.clear()
  }

  /** Category rows are `role="button"`; scope by visible name (substring, case-insensitive). */
  categoryOption(name: string): Locator {
    const trimmed = name.trim()
    if (!trimmed) {
      throw new Error('CategoryTreeSelectDialog.categoryOption: name must be non-empty')
    }
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return this.dialog.getByRole('button', { name: new RegExp(escaped, 'i') })
  }

  async selectCategory(name: string) {
    await this.categoryOption(name).click()
  }

  async close() {
    await this.closeButton.click()
  }
}
