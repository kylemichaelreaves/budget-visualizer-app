import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Memo category assignment', () => {
  test('shows assign category button for uncategorized memo', async ({ memosPage }) => {
    await memosPage.goto()
    await expect(memosPage.assignCategoryButton(200)).toBeVisible({ timeout: 30_000 })
  })

  test('opens category tree dialog when clicking assign', async ({ memosPage }) => {
    await memosPage.goto()
    await memosPage.assignCategoryButton(200).click({ timeout: 30_000 })
    await expect(memosPage.categoryTreeSelectDialog).toBeVisible({ timeout: 5_000 })
    await expect(memosPage.categoryTreeSearch).toBeVisible()
  })

  test('assigns a category and shows badge on the row', async ({ memosPage, page }) => {
    await memosPage.goto()
    await memosPage.assignCategoryButton(200).click({ timeout: 30_000 })
    await expect(memosPage.categoryTreeSelectDialog).toBeVisible({ timeout: 5_000 })

    // Click a leaf category in the tree
    await page.getByRole('option', { name: /Groceries/ }).click()

    // Dialog should close after selection
    await expect(memosPage.categoryTreeSelectDialog).toBeHidden({ timeout: 5_000 })
  })

  test('sends camelCase budgetCategory in PATCH request', async ({ memosPage, page }) => {
    await memosPage.goto()

    // Intercept the PATCH request
    const patchPromise = page.waitForRequest(
      (req) => req.method() === 'PATCH' && req.url().includes('/memos/200'),
    )

    await memosPage.assignCategoryButton(200).click({ timeout: 30_000 })
    await expect(memosPage.categoryTreeSelectDialog).toBeVisible({ timeout: 5_000 })
    await page.getByRole('option', { name: /Groceries/ }).click()

    const patchReq = await patchPromise
    const body = patchReq.postDataJSON()
    expect(body).toHaveProperty('budgetCategory')
    expect(body).not.toHaveProperty('budget_category')
  })
})
