import type { Locator, Page } from '@playwright/test'

export class TransactionCreateDialog {
  readonly page: Page
  readonly dialog: Locator
  readonly heading: Locator
  readonly dateInput: Locator
  readonly descriptionInput: Locator
  readonly memoInput: Locator
  readonly amountDebitInput: Locator
  readonly amountCreditInput: Locator
  readonly debitToggle: Locator
  readonly submitButton: Locator
  readonly closeButton: Locator
  readonly errorAlert: Locator

  constructor(page: Page) {
    this.page = page
    this.dialog = page.getByRole('dialog')
    this.heading = this.dialog.getByRole('heading', { name: 'Add New Transaction' })
    this.dateInput = this.dialog.getByLabel('Date')
    this.descriptionInput = this.dialog.getByLabel('Description')
    this.memoInput = this.dialog.getByLabel('Memo')
    this.amountDebitInput = this.dialog.getByLabel('Amount Debit')
    this.amountCreditInput = this.dialog.getByLabel('Amount Credit')
    this.debitToggle = this.dialog.getByLabel(/debit/i)
    this.submitButton = this.dialog.getByRole('button', { name: /create transaction/i })
    this.closeButton = this.dialog.getByRole('button', { name: /dismiss|close/i })
    this.errorAlert = this.dialog.getByRole('alert')
  }

  async fill(fields: { date: string; description: string; memo?: string; amount: string }) {
    await this.dateInput.fill(fields.date)
    await this.descriptionInput.fill(fields.description)
    if (fields.memo) {
      await this.memoInput.fill(fields.memo)
    }
    await this.amountDebitInput.fill(fields.amount)
  }

  async submit() {
    await this.submitButton.click()
  }

  async close() {
    await this.closeButton.click()
  }
}
