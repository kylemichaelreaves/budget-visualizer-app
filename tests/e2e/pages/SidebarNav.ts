import type { Locator, Page } from '@playwright/test'

export class SidebarNav {
  readonly page: Page
  readonly nav: Locator
  readonly transactionsLink: Locator
  readonly pendingLink: Locator
  readonly memosLink: Locator
  readonly budgetCategoriesLink: Locator
  readonly loanCalculatorLink: Locator
  readonly addTransactionButton: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = page.getByRole('navigation', { name: /budget visualizer sections/i })
    this.transactionsLink = this.nav.getByRole('link', { name: 'Transactions' })
    this.pendingLink = this.nav.getByRole('link', { name: 'Pending' })
    this.memosLink = this.nav.getByRole('link', { name: 'Memos' })
    this.budgetCategoriesLink = this.nav.getByRole('link', { name: 'Budget Categories' })
    this.loanCalculatorLink = this.nav.getByRole('link', { name: 'Loan Calculator' })
    this.addTransactionButton = page.getByRole('button', { name: 'Add New Transaction' })
  }

  async navigateToTransactions() {
    await this.transactionsLink.click()
  }

  async navigateToPending() {
    await this.pendingLink.click()
  }

  async navigateToMemos() {
    await this.memosLink.click()
  }

  async navigateToBudgetCategories() {
    await this.budgetCategoriesLink.click()
  }

  async navigateToLoanCalculator() {
    await this.loanCalculatorLink.click()
  }
}
