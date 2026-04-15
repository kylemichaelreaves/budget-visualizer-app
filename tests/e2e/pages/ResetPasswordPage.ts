import type { Locator, Page } from '@playwright/test'

export class ResetPasswordPage {
  readonly page: Page
  readonly heading: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator
  readonly missingTokenAlert: Locator
  readonly validationMessage: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /choose a new password/i })
    this.newPasswordInput = page.getByTestId('reset-password-new-input')
    this.confirmPasswordInput = page.getByTestId('reset-password-confirm-input')
    this.submitButton = page.getByTestId('reset-password-submit')
    this.errorAlert = page.getByTestId('reset-password-error')
    this.missingTokenAlert = page.getByTestId('reset-password-missing-token')
    this.validationMessage = page.getByTestId('reset-password-validation')
  }

  async goto(token: string) {
    await this.page.goto(`/reset-password?token=${encodeURIComponent(token)}`)
  }

  async submit(newPassword: string, confirmPassword = newPassword) {
    await this.newPasswordInput.fill(newPassword)
    await this.confirmPasswordInput.fill(confirmPassword)
    await this.submitButton.click()
  }
}
