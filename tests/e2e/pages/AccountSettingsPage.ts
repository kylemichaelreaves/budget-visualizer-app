import type { Locator, Page } from '@playwright/test'

export class AccountSettingsPage {
  readonly page: Page
  readonly currentPasswordInput: Locator
  readonly newPasswordInput: Locator
  readonly confirmPasswordInput: Locator
  readonly submitButton: Locator
  readonly errorAlert: Locator
  readonly forgotLink: Locator
  readonly changeAgainButton: Locator
  readonly doneButton: Locator

  constructor(page: Page) {
    this.page = page
    this.currentPasswordInput = page.getByTestId('change-password-current-input')
    this.newPasswordInput = page.getByTestId('change-password-new-input')
    this.confirmPasswordInput = page.getByTestId('change-password-confirm-input')
    this.submitButton = page.getByTestId('change-password-submit')
    this.errorAlert = page.getByTestId('change-password-error')
    this.forgotLink = page.getByTestId('change-password-forgot-link')
    this.changeAgainButton = page.getByTestId('change-password-change-again')
    this.doneButton = page.getByTestId('change-password-done')
  }

  async gotoSecurity() {
    await this.page.goto('/budget-visualizer/account?section=security')
  }

  async submit(current: string, newPw: string, confirm = newPw) {
    await this.currentPasswordInput.fill(current)
    await this.newPasswordInput.fill(newPw)
    await this.confirmPasswordInput.fill(confirm)
    await this.submitButton.click()
  }
}
