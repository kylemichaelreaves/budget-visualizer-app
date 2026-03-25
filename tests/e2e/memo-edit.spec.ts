import { authenticatedTest as test, expect } from './fixtures/fixtures'

test.describe('Memo edit', () => {
  test('loads edit form with memo data', async ({ memoEditPage }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.heading).toBeVisible({ timeout: 10_000 })
    await expect(memoEditPage.form).toBeVisible()
    await expect(memoEditPage.nameInput).toBeVisible()
    await expect(memoEditPage.nameInput).toHaveValue('E2E Memo')
  })

  test('shows form controls', async ({ memoEditPage }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.form).toBeVisible({ timeout: 10_000 })
    await expect(memoEditPage.recurringCheckbox).toBeVisible()
    await expect(memoEditPage.necessaryCheckbox).toBeVisible()
    await expect(memoEditPage.ambiguousCheckbox).toBeVisible()
    await expect(memoEditPage.frequencySelect).toBeVisible()
    await expect(memoEditPage.saveButton).toBeVisible()
  })

  test('checkboxes reflect memo data', async ({ memoEditPage }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.form).toBeVisible({ timeout: 10_000 })
    // API mock returns recurring: false, necessary: false, ambiguous: false
    await expect(memoEditPage.recurringCheckbox).not.toBeChecked()
    await expect(memoEditPage.necessaryCheckbox).not.toBeChecked()
    await expect(memoEditPage.ambiguousCheckbox).not.toBeChecked()
  })

  test('save sends PATCH request with form data', async ({ memoEditPage, page }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.form).toBeVisible({ timeout: 10_000 })

    const patchPromise = page.waitForRequest(
      (req) => req.url().includes('/memos/1') && req.method() === 'PATCH',
    )
    await memoEditPage.save()
    const patchReq = await patchPromise
    const body = patchReq.postDataJSON()
    expect(body).toHaveProperty('id', 1)
    expect(body).toHaveProperty('name', 'E2E Memo')
  })

  test('back button is visible', async ({ memoEditPage }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.backButton).toBeVisible()
  })
})
