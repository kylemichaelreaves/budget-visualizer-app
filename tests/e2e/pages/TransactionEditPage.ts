import type { Locator, Page } from '@playwright/test'

export class TransactionEditPage {
  readonly page: Page
  readonly heading: Locator
  readonly backButton: Locator
  readonly loadingIndicator: Locator
  readonly errorAlert: Locator
  readonly notFoundAlert: Locator
  readonly form: Locator
  readonly dateInput: Locator
  readonly descriptionInput: Locator
  readonly amountDebitInput: Locator
  readonly amountCreditInput: Locator
  readonly saveButton: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /edit.*transaction/i })
    this.backButton = page.getByRole('button', { name: 'Back' })
    this.loadingIndicator = page.getByTestId('transaction-edit-loading')
    this.errorAlert = page.getByTestId('transaction-edit-error-alert')
    this.notFoundAlert = page.getByTestId('transaction-not-found-alert')
    this.form = page.getByRole('form', { name: /transaction edit form/i })
    this.dateInput = this.form.getByLabel('Date')
    this.descriptionInput = this.form.getByLabel('Description')
    this.amountDebitInput = this.form.getByLabel('Amount Debit')
    this.amountCreditInput = this.form.getByLabel('Amount Credit')
    this.saveButton = this.form.getByRole('button', { name: 'Save' })
  }

  async goto(transactionId: number) {
    await this.page.goto(`/budget-visualizer/transactions/${transactionId}/edit`)
  }

  async gotoPending(pendingTransactionId: number) {
    await this.page.goto(`/budget-visualizer/transactions/pending/${pendingTransactionId}/edit`)
  }

  async save() {
    await this.saveButton.click()
  }
}
