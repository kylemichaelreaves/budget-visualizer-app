import type { Locator, Page } from '@playwright/test'

export class SplitBudgetCategoryDrawer {
  readonly page: Page
  readonly drawer: Locator
  readonly heading: Locator
  readonly saveButton: Locator
  readonly cancelButton: Locator
  readonly addSplitButton: Locator
  readonly rows: Locator

  constructor(page: Page) {
    this.page = page
    this.drawer = page.getByRole('dialog', { name: /split budget category drawer/i })
    this.heading = this.drawer.getByRole('heading', { name: /split transaction/i })
    this.saveButton = this.drawer.getByRole('button', { name: /save splits/i })
    this.cancelButton = this.drawer.getByRole('button', { name: /cancel/i })
    this.addSplitButton = this.drawer.getByRole('button', { name: /add split/i })
    this.rows = this.drawer.getByTestId('split-row')
  }

  splitCategorySelect(index: number) {
    return this.drawer.getByTestId(`split-category-${index}`)
  }

  splitAmountInput(index: number) {
    return this.drawer.getByTestId(`split-amount-${index}`)
  }

  splitRemoveButton(index: number) {
    return this.drawer.getByTestId(`split-remove-${index}`)
  }

  async addSplit() {
    await this.addSplitButton.click()
  }

  async save() {
    await this.saveButton.click()
  }

  async cancel() {
    await this.cancelButton.click()
  }

  async setSplitAmount(index: number, amount: string) {
    const input = this.splitAmountInput(index)
    await input.fill(amount)
  }
}
