import type { Locator, Page } from '@playwright/test'

export class LoanCalculatorPage {
  readonly page: Page
  readonly heading: Locator
  readonly loanAmountInput: Locator
  readonly interestRateInput: Locator
  readonly loanTermInput: Locator
  readonly startDateInput: Locator
  readonly calculateButton: Locator
  readonly resetButton: Locator
  readonly summary: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /loan calculator/i })
    this.loanAmountInput = page.getByPlaceholder('Enter loan amount')
    this.interestRateInput = page.getByPlaceholder('Enter interest rate')
    this.loanTermInput = page.getByPlaceholder('Enter loan term')
    this.startDateInput = page.getByPlaceholder('Select start date')
    this.calculateButton = page.getByRole('button', { name: 'Calculate' })
    this.resetButton = page.getByRole('button', { name: 'Reset' })
    this.summary = page.locator('p').filter({ hasText: /Monthly:/ })
  }

  async goto() {
    await this.page.goto('/budget-visualizer/loan-calculator')
  }

  async fillForm(amount: string, rate: string, term: string) {
    await this.loanAmountInput.fill(amount)
    await this.interestRateInput.fill(rate)
    await this.loanTermInput.fill(term)
  }

  async calculate() {
    await this.calculateButton.click()
  }

  async reset() {
    await this.resetButton.click()
  }
}
