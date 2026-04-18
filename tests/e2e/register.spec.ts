import { expect, test } from './fixtures/fixtures'
import { installApiMocks } from './fixtures/install-api-mocks'

test.describe('Register', () => {
  test('create account from register page redirects when API returns session', async ({
    page,
    registerPage,
  }) => {
    await installApiMocks(page)
    await registerPage.goto()
    await registerPage.submitRegistration({
      username: 'newuser',
      email: 'newuser@example.test',
      password: 'Passw0rd1!',
    })
    await expect(page).toHaveURL(/\/budget-visualizer\/transactions/, { timeout: 10_000 })
  })

  test('login page links to register', async ({ page, loginPage }) => {
    await loginPage.goto()
    await loginPage.registerLink.click()
    await expect(page).toHaveURL(/\/register/)
  })
})
