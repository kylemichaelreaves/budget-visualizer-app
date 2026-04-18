import type { Locator, Page } from '@playwright/test'

/** POM for `/register` (create account). */
export class RegisterPage {
  readonly page: Page
  readonly heading: Locator
  readonly usernameInput: Locator
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator
  readonly errorCallout: Locator
  readonly signInLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /create your account/i })
    this.usernameInput = page.getByTestId('register-username-input')
    this.emailInput = page.getByTestId('register-email-input')
    this.passwordInput = page.getByTestId('register-password-input')
    this.confirmPasswordInput = page.getByTestId('register-confirm-input')
    this.submitButton = page.getByTestId('register-submit')
    this.errorCallout = page.getByTestId('register-error')
    this.signInLink = page.getByRole('link', { name: /^sign in$/i })
  }

  async goto() {
    await this.page.goto('/register')
  }

  /**
   * Fills the form and submits. Defaults `confirmPassword` to `password` when omitted.
   */
  async submitRegistration(opts: {
    username: string
    email: string
    password: string
    confirmPassword?: string
  }) {
    const confirm = opts.confirmPassword ?? opts.password
    await this.usernameInput.fill(opts.username)
    await this.emailInput.fill(opts.email)
    await this.passwordInput.fill(opts.password)
    await this.confirmPasswordInput.fill(confirm)
    await this.submitButton.click()
  }
}
