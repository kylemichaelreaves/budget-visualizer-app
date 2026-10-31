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

  // #83: the sort must cover every memo, not just the pages already loaded, so it
  // goes to the server; the first page is the API's top rows.
  test('sorting asks the API to order every memo before paging', async ({ memosPage }) => {
    await memosPage.goto()
    await expect(memosPage.table).toBeVisible({ timeout: 30_000 })
    const sortButton = memosPage.page.getByRole('button', { name: 'Sort by Total Debit' })

    const ascending = memosPage.page.waitForRequest(
      (r) =>
        r.url().includes('/memos?') && new URL(r.url()).searchParams.get('sortKey') === 'total_amount_debit',
    )
    await sortButton.click()
    const asc = new URL((await ascending).url()).searchParams
    expect(asc.get('sortDir')).toBe('asc')
    expect(asc.get('offset')).toBe('0')

    const descending = memosPage.page.waitForRequest(
      (r) => r.url().includes('/memos?') && new URL(r.url()).searchParams.get('sortDir') === 'desc',
    )
    await sortButton.click()
    await descending
    await expect(memosPage.table.locator('[data-testid^="memo-name-link-"]').first()).toHaveAttribute(
      'data-testid',
      'memo-name-link-200',
    )
  })
})
