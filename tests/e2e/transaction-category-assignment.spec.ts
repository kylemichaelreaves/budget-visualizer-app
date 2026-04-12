import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Transaction category assignment', () => {
  test('shows assign category button for uncategorized transaction', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await expect(transactionsPage.assignCategoryButton(100)).toBeVisible({ timeout: 30_000 })
  })

  test('opens category tree dialog when clicking assign', async ({ transactionsPage }) => {
    await transactionsPage.goto()
    await transactionsPage.assignCategoryButton(100).click({ timeout: 30_000 })
    await expect(transactionsPage.categoryTreeSelectDialog).toBeVisible({ timeout: 5_000 })
    await expect(transactionsPage.categoryTreeSearch).toBeVisible()
  })

  test('assigns a category and shows badge on the row', async ({ transactionsPage, page }) => {
    await transactionsPage.goto()
    await transactionsPage.assignCategoryButton(100).click({ timeout: 30_000 })
    await expect(transactionsPage.categoryTreeSelectDialog).toBeVisible({ timeout: 5_000 })

    // Click a leaf category in the tree
    await page.getByRole('button', { name: /Groceries/ }).click()

    // Dialog should close and badge should appear on the row
    await expect(transactionsPage.categoryTreeSelectDialog).toBeHidden({ timeout: 5_000 })
    await expect(transactionsPage.categoryBadge(100)).toBeVisible({ timeout: 5_000 })
  })

  test('sends camelCase budgetCategory in PATCH request', async ({ transactionsPage, page }) => {
    await transactionsPage.goto()

    // Intercept the PATCH request
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes('/transactions/100'),
    )

    await transactionsPage.assignCategoryButton(100).click({ timeout: 30_000 })
    await expect(transactionsPage.categoryTreeSelectDialog).toBeVisible({ timeout: 5_000 })
    await page.getByRole('button', { name: /Groceries/ }).click()

    const patchReq = await patchPromise
    const body = patchReq.postDataJSON()
    expect(body).toHaveProperty('budgetCategory')
    expect(body).not.toHaveProperty('budget_category')
  })
})
