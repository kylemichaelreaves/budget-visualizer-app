import type { Locator, Page } from '@playwright/test'

export class ForgotPasswordPage {
  readonly page: Page
  readonly heading: Locator
  readonly emailInput: Locator
  readonly submitButton: Locator
  readonly successAlert: Locator
  readonly errorAlert: Locator
  readonly backToSignInLink: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /forgot password/i })
    this.emailInput = page.getByTestId('forgot-password-email-input')
    this.submitButton = page.getByTestId('forgot-password-submit')
    this.successAlert = page.getByTestId('forgot-password-success')
    this.errorAlert = page.getByTestId('forgot-password-error')
    this.backToSignInLink = page.getByRole('link', { name: /back to login/i })
  }

  async goto() {
    await this.page.goto('/password/reset')
  }

  async submit(email: string) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }
}
