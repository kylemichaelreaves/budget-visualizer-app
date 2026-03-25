import type { Locator, Page } from '@playwright/test'

export class BudgetCategoriesPage {
  readonly page: Page
  readonly heading: Locator
  readonly filterInput: Locator
  readonly refreshButton: Locator
  readonly tree: Locator
  readonly loadingMessage: Locator
  readonly emptyMessage: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /budget categories/i })
    this.filterInput = page.getByLabel('Filter categories')
    this.refreshButton = page.getByRole('button', { name: /refresh/i })
    this.tree = page.getByTestId('budget-categories-tree')
    this.loadingMessage = page.getByTestId('budget-categories-loading')
    this.emptyMessage = page.getByTestId('budget-categories-empty')
    this.errorAlert = page.getByTestId('budget-categories-error')
  }

  async goto() {
    await this.page.goto('/budget-visualizer/budget-categories')
  }

  async filterBy(text: string) {
    await this.filterInput.fill(text)
  }

  async refresh() {
    await this.refreshButton.click()
  }
}
