import type { Route } from '@playwright/test'
import { test, expect } from './fixtures/fixtures'

/**
 * Installs scoped mocks for the two password-reset endpoints. Each test sets up
 * its own route handlers so behavior (success / failure / payload capture) is
 * self-contained.
 */
async function mockResetEndpoints(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  opts: {
    requestHandler?: (route: Route) => Promise<void>
    confirmHandler?: (route: Route) => Promise<void>
  } = {},
) {
  const defaultOk = async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'ok' }),
    })
  }

  await page.route(/\/api\/v1\/password\/reset$/, opts.requestHandler ?? defaultOk)
  await page.route(/\/api\/v1\/password\/confirm$/, opts.confirmHandler ?? defaultOk)
}

test.describe('Password reset flow', () => {
  test.describe('Forgot password page', () => {
    test('renders heading, email input, and submit button', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await expect(forgotPasswordPage.heading).toBeVisible()
      await expect(forgotPasswordPage.emailInput).toBeVisible()
      await expect(forgotPasswordPage.submitButton).toBeVisible()
    })

    test('submit button stays disabled for an invalid email', async ({ forgotPasswordPage }) => {
      await forgotPasswordPage.goto()
      await expect(forgotPasswordPage.submitButton).toBeDisabled()
      await forgotPasswordPage.emailInput.fill('not-an-email')
      await expect(forgotPasswordPage.submitButton).toBeDisabled()
      await forgotPasswordPage.emailInput.fill('user@example.com')
      await expect(forgotPasswordPage.submitButton).toBeEnabled()
    })

    test('successful request POSTs {email} and shows the neutral success alert', async ({
      page,
      forgotPasswordPage,
    }) => {
      let body: unknown = null
      await mockResetEndpoints(page, {
        requestHandler: async (route) => {
          body = route.request().postDataJSON()
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'ok' }),
          })
        },
      })

      await forgotPasswordPage.goto()
      await forgotPasswordPage.submit('user@example.com')
      await expect(forgotPasswordPage.successAlert).toBeVisible({ timeout: 5_000 })
      expect(body).toEqual({ email: 'user@example.com' })
    })

    test('trims whitespace from the email before submitting', async ({ page, forgotPasswordPage }) => {
      let body: unknown = null
      await mockResetEndpoints(page, {
        requestHandler: async (route) => {
          body = route.request().postDataJSON()
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'ok' }),
          })
        },
      })

      await forgotPasswordPage.goto()
      await forgotPasswordPage.submit('  user@example.com  ')
      await expect(forgotPasswordPage.successAlert).toBeVisible({ timeout: 5_000 })
      expect(body).toEqual({ email: 'user@example.com' })
    })

    test('shows error alert when the backend returns 5xx', async ({ page, forgotPasswordPage }) => {
      await mockResetEndpoints(page, {
        requestHandler: async (route) => {
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Server error' }),
          })
        },
      })

      await forgotPasswordPage.goto()
      await forgotPasswordPage.submit('user@example.com')
      await expect(forgotPasswordPage.errorAlert).toBeVisible({ timeout: 5_000 })
    })
  })

  test.describe('Reset password page', () => {
    test('shows missing-token alert when ?token= is absent', async ({ page, resetPasswordPage }) => {
      await page.goto('/password/confirm')
      await expect(resetPasswordPage.missingTokenHeading).toBeVisible({ timeout: 5_000 })
    })

    test('shows validation errors for weak or mismatched passwords on submit', async ({
      page,
      resetPasswordPage,
    }) => {
      await resetPasswordPage.goto('opaque-token-123')
      await expect(resetPasswordPage.submitButton).toBeEnabled()

      // Submit with weak password shows error
      await resetPasswordPage.newPasswordInput.fill('short')
      await resetPasswordPage.confirmPasswordInput.fill('short')
      await resetPasswordPage.submitButton.click()
      await expect(page.getByText(/too weak/i)).toBeVisible({ timeout: 5_000 })

      // Submit with mismatched passwords shows error
      await resetPasswordPage.newPasswordInput.fill('Passw0rd1!')
      await resetPasswordPage.confirmPasswordInput.fill('mismatch1')
      await resetPasswordPage.submitButton.click()
      await expect(page.getByText(/don.t match/i)).toBeVisible({ timeout: 5_000 })
    })

    test('successful reset POSTs {token, newPassword} and shows success screen', async ({
      page,
      resetPasswordPage,
    }) => {
      let body: unknown = null
      await mockResetEndpoints(page, {
        confirmHandler: async (route) => {
          body = route.request().postDataJSON()
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'ok' }),
          })
        },
      })

      await resetPasswordPage.goto('opaque-token-abc')
      await resetPasswordPage.submit('Passw0rd1!')

      await expect(page.getByRole('heading', { name: /password updated/i })).toBeVisible({ timeout: 5_000 })
      expect(body).toEqual({ token: 'opaque-token-abc', newPassword: 'Passw0rd1!' })

      // Click "Go to login" navigates to /login?resetSuccess=1
      await page.getByRole('button', { name: /go to login/i }).click()
      await expect(page).toHaveURL(/\/login\?resetSuccess=1/, { timeout: 5_000 })
    })

    test('shows an error alert when the backend rejects the token', async ({ page, resetPasswordPage }) => {
      await mockResetEndpoints(page, {
        confirmHandler: async (route) => {
          await route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ message: 'Reset link has expired' }),
          })
        },
      })

      await resetPasswordPage.goto('opaque-token-abc')
      await resetPasswordPage.submit('newStrongPass1')
      await expect(resetPasswordPage.errorAlert).toBeVisible({ timeout: 5_000 })
    })
  })

  test.describe('Full happy path', () => {
    test('forgot-password → reset → login redirects with resetSuccess flag', async ({
      page,
      forgotPasswordPage,
      resetPasswordPage,
      loginPage,
    }) => {
      await mockResetEndpoints(page)

      // 1) User requests a reset
      await forgotPasswordPage.goto()
      await forgotPasswordPage.submit('user@example.com')
      await expect(forgotPasswordPage.successAlert).toBeVisible({ timeout: 5_000 })

      // 2) They (hypothetically) click the emailed link
      await resetPasswordPage.goto('opaque-reset-token')
      await resetPasswordPage.submit('Passw0rd1!')
      await expect(page.getByRole('heading', { name: /password updated/i })).toBeVisible({ timeout: 5_000 })

      // 3) Click "Go to login" → login page shows the success banner
      await page.getByRole('button', { name: /go to login/i }).click()
      await expect(page).toHaveURL(/\/login\?resetSuccess=1/, { timeout: 5_000 })
      await expect(page.getByTestId('login-reset-success')).toBeVisible()
      await expect(loginPage.heading).toBeVisible()
    })
  })

  test.describe('Login link to forgot password', () => {
    test('login page exposes a forgot-password link that navigates to /password/reset', async ({
      page,
      loginPage,
    }) => {
      await loginPage.goto()
      await page.getByTestId('login-forgot-link').click()
      await expect(page).toHaveURL(/\/password\/reset$/, { timeout: 5_000 })
    })
  })
})
