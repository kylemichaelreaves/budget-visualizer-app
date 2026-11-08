import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Loan calculator', () => {
  test('is reachable from the sidebar', async ({ page, sidebar, loanCalculatorPage }) => {
    await page.goto('/budget-visualizer/transactions')
    await sidebar.navigateToLoanCalculator()
    await expect(page).toHaveURL(/\/budget-visualizer\/loan-calculator$/)
    await expect(loanCalculatorPage.root).toBeVisible()
  })

  test('starts with Calculate and Reset disabled', async ({ loanCalculatorPage }) => {
    await loanCalculatorPage.goto()
    await expect(loanCalculatorPage.estimate).toHaveText('Enter the loan details, then calculate.')
    await expect(loanCalculatorPage.calculateButton).toBeDisabled()
    await expect(loanCalculatorPage.resetButton).toBeDisabled()
  })

  test('calculates an amortized estimate', async ({ loanCalculatorPage }) => {
    await loanCalculatorPage.goto()
    // $10,000 at 6% over 12 months: r = 0.005, payment = rP / (1 - (1 + r)^-12).
    await loanCalculatorPage.fillForm('10000', '6', '12')
    await loanCalculatorPage.calculate()
    await expect(loanCalculatorPage.estimate).toContainText('Monthly: $860.66')
    await expect(loanCalculatorPage.estimate).toContainText('Interest: $327.97')
    await expect(loanCalculatorPage.estimate).toContainText('Total cost: $10,327.97')
  })

  test('splits the principal evenly at 0% interest', async ({ loanCalculatorPage }) => {
    await loanCalculatorPage.goto()
    await loanCalculatorPage.fillForm('1200', '0', '12')
    await loanCalculatorPage.calculate()
    await expect(loanCalculatorPage.estimate).toContainText('Monthly: $100.00')
    await expect(loanCalculatorPage.estimate).toContainText('Interest: $0.00')
  })

  test('editing an input clears a stale estimate', async ({ loanCalculatorPage }) => {
    await loanCalculatorPage.goto()
    await loanCalculatorPage.fillForm('10000', '6', '12')
    await loanCalculatorPage.calculate()
    await expect(loanCalculatorPage.estimate).toContainText('Monthly:')
    await loanCalculatorPage.loanTermInput.fill('24')
    await expect(loanCalculatorPage.estimate).toHaveText('Enter the loan details, then calculate.')
  })

  test('shows a field error and blocks Calculate for a fractional term', async ({ loanCalculatorPage }) => {
    await loanCalculatorPage.goto()
    await loanCalculatorPage.fillForm('10000', '6', '1.5')
    await expect(loanCalculatorPage.fieldError('loanTerm')).toHaveText(
      'Enter a whole number of months, at least 1.',
    )
    await expect(loanCalculatorPage.calculateButton).toBeDisabled()
  })

  test('reset restores the initial form', async ({ loanCalculatorPage }) => {
    await loanCalculatorPage.goto()
    await loanCalculatorPage.fillForm('10000', '6', '12')
    await loanCalculatorPage.calculate()
    await loanCalculatorPage.reset()
    await expect(loanCalculatorPage.loanAmountInput).toHaveValue('')
    await expect(loanCalculatorPage.estimate).toHaveText('Enter the loan details, then calculate.')
    await expect(loanCalculatorPage.resetButton).toBeDisabled()
  })
})
