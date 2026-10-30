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
    await expect(memoEditPage.necessaryCheckbox).toBeVisible()
    await expect(memoEditPage.ambiguousCheckbox).toBeVisible()
    await expect(memoEditPage.frequencySelect).toBeVisible()
    await expect(memoEditPage.saveButton).toBeVisible()
  })

  test('checkboxes reflect memo data', async ({ memoEditPage }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.form).toBeVisible({ timeout: 10_000 })
    // API mock returns necessary: false, ambiguous: false and no frequency
    await expect(memoEditPage.frequencySelect).toHaveValue('')
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
    // The mock memo has no frequency, so it must go back as not recurring:
    // recurring_frequency_check rejects recurring = true with a null frequency.
    expect(body).toMatchObject({ recurring: false, frequency: null })
  })

  test('selecting a frequency saves it as a recurring memo', async ({ memoEditPage, page }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.form).toBeVisible({ timeout: 10_000 })

    await memoEditPage.frequencySelect.selectOption('monthly')

    const patchPromise = page.waitForRequest(
      (req) => req.url().includes('/memos/1') && req.method() === 'PATCH',
    )
    await memoEditPage.save()
    const body = (await patchPromise).postDataJSON()
    expect(body).toMatchObject({ recurring: true, frequency: 'monthly' })
  })

  test('back button is visible', async ({ memoEditPage }) => {
    await memoEditPage.goto(1)
    await expect(memoEditPage.backButton).toBeVisible()
  })
})
