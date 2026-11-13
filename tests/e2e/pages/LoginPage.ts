import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  readonly page: Page
  readonly heading: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator
  readonly registerLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /sign in/i })
    this.emailInput = page.getByTestId('login-email-input')
    this.passwordInput = page.getByTestId('login-password-input')
    this.submitButton = page.getByRole('button', { name: /login|signing in/i })
    this.errorAlert = page.getByTestId('login-error')
    this.registerLink = page.getByTestId('login-register-link')
  }

  async goto() {
    await this.page.goto('/login')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
}
