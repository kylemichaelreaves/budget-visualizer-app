import type { Locator, Page } from '@playwright/test'

export class MemoEditPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly loadingIndicator: Locator
  readonly errorAlert: Locator
  readonly form: Locator
  readonly nameInput: Locator
  readonly recurringCheckbox: Locator
  readonly necessaryCheckbox: Locator
  readonly ambiguousCheckbox: Locator
  readonly frequencySelect: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /edit memo/i })
    this.backButton = page.getByRole('button', { name: 'Back' })
    this.loadingIndicator = page.getByTestId('memo-edit-loading')
    this.errorAlert = page.getByTestId('memo-edit-load-error')
    this.form = page.getByTestId('memo-edit-form')
    this.nameInput = this.form.getByLabel('Name')
    this.recurringCheckbox = this.form.getByLabel('Recurring')
    this.necessaryCheckbox = this.form.getByLabel('Necessary')
    this.ambiguousCheckbox = this.form.getByLabel('Ambiguous')
    this.frequencySelect = this.form.getByLabel('Frequency')
    this.saveButton = this.form.getByRole('button', { name: /save/i })
  }

  async goto(memoId: number) {
    await this.page.goto(`/budget-visualizer/memos/${memoId}/edit`)
  }

  async save() {
    await this.saveButton.click()
  }
}
