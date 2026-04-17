import type { Locator, Page } from '@playwright/test'

export class ResetPasswordPage {
  readonly page: Page
  readonly heading: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator
  readonly missingTokenHeading: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /reset your password/i })
    this.newPasswordInput = page.getByTestId('reset-password-new-input')
    this.confirmPasswordInput = page.getByTestId('reset-password-confirm-input')
    this.submitButton = page.getByTestId('reset-password-submit')
    this.errorAlert = page.getByTestId('reset-password-error')
    this.missingTokenHeading = page.getByRole('heading', { name: /missing reset token/i })
  }

  async goto(token: string) {
    await this.page.goto(`/password/confirm?token=${encodeURIComponent(token)}`)
  }

  async submit(newPassword: string, confirmPassword = newPassword) {
    await this.newPasswordInput.fill(newPassword)
    await this.confirmPasswordInput.fill(confirmPassword)
    await this.submitButton.click()
  }
}
