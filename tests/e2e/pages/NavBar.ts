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
    this.userMenuButton = this.nav.getByRole('button', { name: /account menu/i })
    this.adminBadge = this.nav.getByText('admin', { exact: true })
  }

  loginLabel() {
    return this.nav.getByTestId('navbar-login-label')
  }

  /** Log In when unauthenticated; opens user menu and chooses Log out when authenticated. */
  async clickLoginLogout() {
    if (await this.loginButton.isVisible()) {
      await this.loginButton.click()
      return
    }
    await this.userMenuButton.click()
    await this.page.getByTestId('navbar-menu-logout').click()
  }
}
