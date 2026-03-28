import type { Locator, Page } from '@playwright/test'

export class NavBar {
  readonly page: Page
  readonly nav: Locator
  readonly brandLink: Locator
  readonly loginButton: Locator
  readonly userMenuButton: Locator
  readonly adminBadge: Locator

  constructor(page: Page) {
    this.page = page
    this.nav = page.getByRole('navigation', { name: /main navigation/i })
    this.brandLink = this.nav.getByRole('link', { name: 'Budget Visualizer' })
    this.loginButton = this.nav.getByRole('button', { name: /log in/i })
    this.userMenuButton = this.nav.getByRole('button', { name: /user menu/i })
    this.adminBadge = this.nav.getByText('admin', { exact: true })
  }

  loginLabel() {
    return this.nav.getByTestId('navbar-login-label')
  }

  async clickLoginLogout() {
    await this.nav.getByRole('button').click()
  }
}
