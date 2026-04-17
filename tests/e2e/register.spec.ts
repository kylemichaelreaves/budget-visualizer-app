import { expect, test } from './fixtures/fixtures'
import { installApiMocks } from './fixtures/install-api-mocks'

test.describe('Register', () => {
  test('create account from register page redirects when API returns session', async ({ page }) => {
    await installApiMocks(page)
    await page.goto('/register')

    await page.getByTestId('register-username-input').fill('newuser')
    await page.getByTestId('register-email-input').fill('newuser@example.test')
    await page.getByTestId('register-password-input').fill('Passw0rd1!')
    await page.getByTestId('register-confirm-input').fill('Passw0rd1!')

    await page.getByTestId('register-submit').click()

    await expect(page).toHaveURL(/\/budget-visualizer\/transactions/, { timeout: 10_000 })
  })

  test('login page links to register', async ({ page }) => {
    await page.goto('/login')
    await page.getByTestId('login-register-link').click()
    await expect(page).toHaveURL(/\/register/)
  })
})
