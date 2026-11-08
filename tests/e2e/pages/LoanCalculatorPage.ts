import type { Locator, Page } from '@playwright/test'

export class LoanCalculatorPage {
  readonly page: Page
  readonly root: Locator
  readonly loanAmountInput: Locator
  readonly interestRateInput: Locator
  readonly loanTermInput: Locator
  readonly startDateInput: Locator
  readonly calculateButton: Locator
  readonly resetButton: Locator
  /** The header line: a prompt until calculated, then the estimate. */
  readonly estimate: Locator

  constructor(page: Page) {
    this.page = page
    this.root = page.getByTestId('loan-calculator')
    this.loanAmountInput = page.getByTestId('loan-loanAmount')
    this.interestRateInput = page.getByTestId('loan-interestRate')
    this.loanTermInput = page.getByTestId('loan-loanTerm')
    this.startDateInput = page.getByTestId('loan-startDate')
    this.calculateButton = page.getByTestId('loan-calculate')
    this.resetButton = page.getByTestId('loan-reset')
    this.estimate = page.getByTestId('loan-estimate')
  }

  async goto() {
    await this.page.goto('/budget-visualizer/loan-calculator')
  }

  fieldError(prop: 'loanAmount' | 'interestRate' | 'loanTerm' | 'startDate'): Locator {
    return this.page.getByTestId(`loan-${prop}-error`)
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
