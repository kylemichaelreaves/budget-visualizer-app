import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Split Budget Category', () => {
  test('split checkbox is visible on transaction edit form', async ({ transactionEditPage }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.form).toBeVisible({ timeout: 10_000 })
    const splitCheckbox = transactionEditPage.page.getByLabel(/split into multiple categories/i)
    await expect(splitCheckbox).toBeVisible()
  })

  test('checking split checkbox opens the split drawer', async ({
    transactionEditPage,
    splitBudgetCategoryDrawer,
  }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.form).toBeVisible({ timeout: 10_000 })
    const splitCheckbox = transactionEditPage.page.getByLabel(/split into multiple categories/i)
    await splitCheckbox.click()
    await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })
    await expect(splitBudgetCategoryDrawer.heading).toBeVisible()
  })

  test('drawer shows Save and Cancel buttons', async ({ transactionEditPage, splitBudgetCategoryDrawer }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.form).toBeVisible({ timeout: 10_000 })
    await transactionEditPage.page.getByLabel(/split into multiple categories/i).click()
    await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })
    await expect(splitBudgetCategoryDrawer.saveButton).toBeVisible()
    await expect(splitBudgetCategoryDrawer.cancelButton).toBeVisible()
  })

  test('Add split button adds a new split row', async ({
    transactionEditPage,
    splitBudgetCategoryDrawer,
  }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.form).toBeVisible({ timeout: 10_000 })
    await transactionEditPage.page.getByLabel(/split into multiple categories/i).click()
    await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })

    const initialCount = await splitBudgetCategoryDrawer.rows.count()
    // Reduce the first split amount so Add split is enabled
    if (initialCount > 0) {
      await splitBudgetCategoryDrawer.setSplitAmount(0, '10')
    }
    await splitBudgetCategoryDrawer.addSplit()
    const newCount = await splitBudgetCategoryDrawer.rows.count()
    expect(newCount).toBeGreaterThan(initialCount)
  })

  test('cancel button closes the drawer', async ({ transactionEditPage, splitBudgetCategoryDrawer }) => {
    await transactionEditPage.goto(1)
    await expect(transactionEditPage.form).toBeVisible({ timeout: 10_000 })
    await transactionEditPage.page.getByLabel(/split into multiple categories/i).click()
    await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })
    await splitBudgetCategoryDrawer.cancel()
    await expect(splitBudgetCategoryDrawer.drawer).toBeHidden({ timeout: 10_000 })
  })
})
