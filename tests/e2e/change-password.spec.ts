import type { Page, Route } from '@playwright/test'
import { authenticatedTest as test, expect } from './fixtures/fixtures'

/**
 * Scoped mock for `POST /api/v1/password/change`. Each test installs its own
 * handler so success / failure / payload capture are self-contained.
 */
async function mockChangePasswordEndpoint(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route(/\/api\/v1\/password\/change$/, handler)
}

const okHandler = async (route: Route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ message: 'Password updated' }),
  })
}

const STRONG_PASSWORD = 'Passw0rd1!'

test.describe('Change password (account → security)', () => {
  test('renders the form with all inputs and a forgot-password link', async ({ accountSettingsPage }) => {
    await accountSettingsPage.gotoSecurity()
    await expect(accountSettingsPage.currentPasswordInput).toBeVisible()
    await expect(accountSettingsPage.newPasswordInput).toBeVisible()
    await expect(accountSettingsPage.confirmPasswordInput).toBeVisible()
    await expect(accountSettingsPage.submitButton).toBeVisible()
    await expect(accountSettingsPage.forgotLink).toBeVisible()
  })

  test('submitting with empty current password shows the current-password error', async ({
    accountSettingsPage,
  }) => {
    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.newPasswordInput.fill(STRONG_PASSWORD)
    await accountSettingsPage.confirmPasswordInput.fill(STRONG_PASSWORD)
    await accountSettingsPage.submitButton.click()
    await expect(accountSettingsPage.page.getByText(/enter your current password/i)).toBeVisible()
  })

  test('submitting with a weak new password shows the strength error', async ({ accountSettingsPage }) => {
    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.submit('current-pw', 'short', 'short')
    await expect(accountSettingsPage.page.getByText(/too weak/i)).toBeVisible()
  })

  test('submitting with mismatched confirm shows the mismatch error', async ({ accountSettingsPage }) => {
    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.submit('current-pw', STRONG_PASSWORD, 'OtherPass1!')
    await expect(accountSettingsPage.page.getByText(/don.t match/i)).toBeVisible()
  })

  test('successful change POSTs {currentPassword, newPassword} and shows the success screen', async ({
    page,
    accountSettingsPage,
  }) => {
    let body: unknown = null
    await mockChangePasswordEndpoint(page, async (route) => {
      body = route.request().postDataJSON()
      await okHandler(route)
    })

    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.submit('current-pw', STRONG_PASSWORD)

    await expect(page.getByText(/password updated/i)).toBeVisible({ timeout: 5_000 })
    expect(body).toEqual({ currentPassword: 'current-pw', newPassword: STRONG_PASSWORD })
    await expect(accountSettingsPage.changeAgainButton).toBeVisible()
    await expect(accountSettingsPage.doneButton).toBeVisible()
  })

  test('"Change again" returns to a cleared form', async ({ page, accountSettingsPage }) => {
    await mockChangePasswordEndpoint(page, okHandler)

    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.submit('current-pw', STRONG_PASSWORD)
    await expect(accountSettingsPage.changeAgainButton).toBeVisible({ timeout: 5_000 })

    await accountSettingsPage.changeAgainButton.click()
    await expect(accountSettingsPage.currentPasswordInput).toBeVisible()
    await expect(accountSettingsPage.currentPasswordInput).toHaveValue('')
    await expect(accountSettingsPage.newPasswordInput).toHaveValue('')
    await expect(accountSettingsPage.confirmPasswordInput).toHaveValue('')
  })

  test('shows the error alert when the backend rejects the current password', async ({
    page,
    accountSettingsPage,
  }) => {
    await mockChangePasswordEndpoint(page, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Current password is incorrect' }),
      })
    })

    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.submit('wrong-pw', STRONG_PASSWORD)
    await expect(accountSettingsPage.errorAlert).toBeVisible({ timeout: 5_000 })
    await expect(accountSettingsPage.errorAlert).toContainText(/current password is incorrect/i)
  })

  test('forgot-password link navigates to the reset flow', async ({ page, accountSettingsPage }) => {
    await accountSettingsPage.gotoSecurity()
    await accountSettingsPage.forgotLink.click()
    await expect(page).toHaveURL(/\/password\/reset$/, { timeout: 5_000 })
  })
})
