import { test, expect } from './fixtures/fixtures'
import { E2E_LOGIN_EMAIL } from './fixtures/auth-storage'

test.describe('Login', () => {
  test('shows login form with email, password, and submit button', async ({ loginPage }) => {
    await loginPage.goto()
    await expect(loginPage.heading).toBeVisible()
    await expect(loginPage.emailInput).toBeVisible()
    await expect(loginPage.passwordInput).toBeVisible()
    await expect(loginPage.submitButton).toBeVisible()
  })

  test('submit button is disabled when fields are empty', async ({ loginPage }) => {
    await loginPage.goto()
    await expect(loginPage.submitButton).toBeDisabled()
  })

  test('submit button is enabled after filling both fields', async ({ loginPage }) => {
    await loginPage.goto()
    await loginPage.emailInput.fill(E2E_LOGIN_EMAIL)
    await loginPage.passwordInput.fill('testpass')
    await expect(loginPage.submitButton).toBeEnabled()
  })
})
