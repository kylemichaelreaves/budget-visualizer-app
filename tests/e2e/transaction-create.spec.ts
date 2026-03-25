import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Transaction create', () => {
  test('opens create dialog from header button', async ({ transactionsPage, sidebar, transactionCreateDialog }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await sidebar.addTransactionButton.click()
    await expect(transactionCreateDialog.dialog).toBeVisible()
    await expect(transactionCreateDialog.heading).toBeVisible()
  })

  test('dialog shows form fields for creating a transaction', async ({
    transactionsPage,
    sidebar,
    transactionCreateDialog,
  }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await sidebar.addTransactionButton.click()
    await expect(transactionCreateDialog.dateInput).toBeVisible()
    await expect(transactionCreateDialog.descriptionInput).toBeVisible()
    await expect(transactionCreateDialog.memoInput).toBeVisible()
    await expect(transactionCreateDialog.amountDebitInput).toBeVisible()
    await expect(transactionCreateDialog.submitButton).toBeVisible()
  })

  test('submitting the form closes the dialog', async ({
    transactionsPage,
    sidebar,
    transactionCreateDialog,
  }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await sidebar.addTransactionButton.click()
    await transactionCreateDialog.fill({
      date: '2024-06-15',
      description: 'E2E test transaction',
      amount: '42.50',
    })
    await transactionCreateDialog.submit()
    await expect(transactionCreateDialog.dialog).toBeHidden({ timeout: 5_000 })
  })

  test('close button dismisses dialog without submitting', async ({
    transactionsPage,
    sidebar,
    transactionCreateDialog,
  }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.filtersSection).toBeVisible({ timeout: 30_000 })
    await sidebar.addTransactionButton.click()
    await expect(transactionCreateDialog.dialog).toBeVisible()
    await transactionCreateDialog.close()
    await expect(transactionCreateDialog.dialog).toBeHidden()
  })
})
