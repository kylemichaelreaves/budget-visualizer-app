import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Transaction edit', () => {
  test('loads form with transaction data', async ({ transactionEditPage }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.heading).toBeVisible({ timeout: 10_000 })
    await expect(transactionEditPage.form).toBeVisible()
    await expect(transactionEditPage.dateInput).toBeVisible()
    await expect(transactionEditPage.descriptionInput).toBeVisible()
    await expect(transactionEditPage.saveButton).toBeVisible()
  })

  test('heading shows transaction id', async ({ transactionEditPage }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.heading).toContainText('1')
  })

  test('back button is visible', async ({ transactionEditPage }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.backButton).toBeVisible()
  })

  test('save button submits and navigates back', async ({ transactionEditPage, page }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.form).toBeVisible({ timeout: 10_000 })
    await transactionEditPage.save()
    // After save, onClose calls history.back() — we should no longer be on the edit page
    await expect(page).not.toHaveURL(/\/edit$/, { timeout: 5_000 })
  })
})
