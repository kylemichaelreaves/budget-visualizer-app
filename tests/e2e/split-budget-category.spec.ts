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

  test.describe('From transactions table row', () => {
    test('split button is visible when category assigned and memo is ambiguous', async ({
      transactionsPage,
    }) => {
      await transactionsPage.goto()
      // Transaction 102 has budget_category = "Food - Restaurants" and memo 202 (ambiguous)
      await expect(transactionsPage.splitButton(102)).toBeVisible({ timeout: 10_000 })
    })

    test('split button is hidden for uncategorized transactions', async ({ transactionsPage }) => {
      await transactionsPage.goto()
      // Transaction 100 has no budget_category — split button should NOT render even if memo is ambiguous
      await expect(transactionsPage.transactionRow(100)).toBeVisible({ timeout: 10_000 })
      await expect(transactionsPage.splitButton(100)).toHaveCount(0)
    })

    test('split button is hidden for credit (income) transactions', async ({ transactionsPage }) => {
      await transactionsPage.goto()
      // Transaction 101 is a credit — no category column content, no split button
      await expect(transactionsPage.transactionRow(101)).toBeVisible({ timeout: 10_000 })
      await expect(transactionsPage.splitButton(101)).toHaveCount(0)
    })

    test('clicking split button opens the split drawer', async ({
      transactionsPage,
      splitBudgetCategoryDrawer,
    }) => {
      await transactionsPage.goto()
      await expect(transactionsPage.splitButton(102)).toBeVisible({ timeout: 10_000 })
      await transactionsPage.clickSplit(102)
      await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })
      await expect(splitBudgetCategoryDrawer.heading).toBeVisible()
    })

    test('cancel closes the drawer opened from row', async ({
      transactionsPage,
      splitBudgetCategoryDrawer,
    }) => {
      await transactionsPage.goto()
      await expect(transactionsPage.splitButton(102)).toBeVisible({ timeout: 10_000 })
      await transactionsPage.clickSplit(102)
      await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })
      await splitBudgetCategoryDrawer.cancel()
      await expect(splitBudgetCategoryDrawer.drawer).toBeHidden({ timeout: 10_000 })
    })

    test('saving splits sends PATCH with budget_category array', async ({
      transactionsPage,
      splitBudgetCategoryDrawer,
      page,
    }) => {
      await transactionsPage.goto()
      await expect(transactionsPage.splitButton(102)).toBeVisible({ timeout: 10_000 })
      await transactionsPage.clickSplit(102)
      await expect(splitBudgetCategoryDrawer.drawer).toBeVisible({ timeout: 5_000 })

      // Split the $12.50 debit into two amounts and assign categories
      await splitBudgetCategoryDrawer.setSplitAmount(0, '8.00')
      await splitBudgetCategoryDrawer.splitCategorySelect(0).selectOption('Food - Groceries')
      await splitBudgetCategoryDrawer.addSplit()
      await splitBudgetCategoryDrawer.setSplitAmount(1, '4.50')
      await splitBudgetCategoryDrawer.splitCategorySelect(1).selectOption('Food - Restaurants')

      const patchPromise = page.waitForRequest(
        (req) => req.method() === 'PATCH' && /\/transactions\/102$/.test(req.url()),
      )
      await splitBudgetCategoryDrawer.save()
      const req = await patchPromise
      const body = req.postDataJSON()
      expect(Array.isArray(body.budgetCategory)).toBe(true)
      expect(body.budgetCategory.length).toBeGreaterThanOrEqual(2)
      expect(body.isSplit).toBe(true)
    })
  })

  test.describe('Memo ambiguity indicator', () => {
    test('shows amber warning for rows whose memo has ambiguous=true', async ({ transactionsPage }) => {
      await transactionsPage.goto()
      // Transaction 100 links to memo 200 which is ambiguous
      await expect(transactionsPage.memoAmbiguityIndicator(100)).toBeVisible({ timeout: 10_000 })
    })

    test('does not show warning for rows with non-ambiguous memo', async ({ transactionsPage }) => {
      await transactionsPage.goto()
      // Transaction 101 has no memo_id — no indicator should render
      await expect(transactionsPage.transactionRow(101)).toBeVisible({ timeout: 10_000 })
      await expect(transactionsPage.memoAmbiguityIndicator(101)).toHaveCount(0)
    })
  })
})
