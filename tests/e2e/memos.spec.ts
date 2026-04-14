import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Memos list', () => {
  test('loads table, search, pagination shell, and sort controls', async ({ memosPage }) => {
    await memosPage.goto()
    await expect(memosPage.heading).toBeVisible({ timeout: 30_000 })
    await expect(memosPage.table).toBeVisible()
    await expect(memosPage.memoNameLink(200)).toBeVisible()
    await expect(memosPage.memoNameLink(201)).toBeVisible()

    await expect(memosPage.pagination).toBeVisible()
    await expect(memosPage.rowsPerPageSelect).toBeVisible()
    await expect(memosPage.paginationPrev).toBeVisible()
    await expect(memosPage.paginationNext).toBeVisible()

    await expect(memosPage.page.getByTestId('column-name')).toBeVisible()
  })

  test('search filters rows by memo name', async ({ memosPage }) => {
    await memosPage.goto()
    await expect(memosPage.memoNameLink(200)).toBeVisible({ timeout: 30_000 })
    await memosPage.search('NETFLIX')
    await expect(memosPage.memoNameLink(201)).toBeVisible()
    await expect(memosPage.memoNameLink(200)).not.toBeVisible()
  })

  test('sort by memo toggles order', async ({ memosPage }) => {
    await memosPage.goto()
    await expect(memosPage.table).toBeVisible({ timeout: 30_000 })
    const sortButton = memosPage.page.getByRole('button', { name: 'Sort by Memo' })
    await sortButton.click()
    const firstLink = memosPage.table.locator('[data-testid^="memo-name-link-"]').first()
    const firstBefore = await firstLink.getAttribute('data-testid')

    await sortButton.click()
    const firstAfter = await memosPage.table
      .locator('[data-testid^="memo-name-link-"]')
      .first()
      .getAttribute('data-testid')

    expect(firstBefore).toBeTruthy()
    expect(firstAfter).toBeTruthy()
    expect(firstBefore).not.toBe(firstAfter)
  })
})
