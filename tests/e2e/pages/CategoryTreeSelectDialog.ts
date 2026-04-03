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
    this.closeButton = this.dialog.locator('[data-slot="dialog-close"]')
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

  async selectCategory(name: string) {
    await this.dialog.getByRole('button', { name, exact: false }).click()
  }

  async close() {
    await this.closeButton.click()
  }

  categoryOption(name: string): Locator {
    return this.dialog.getByRole('button', { name, exact: false })
  }
}
