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
    this.adminBadge = this.nav.getByTestId('navbar-admin-badge')
  }

  loginLabel() {
    return this.nav.getByTestId('navbar-login-label')
  }

  /**
   * Separate methods rather than one that branches on `isVisible()`: that check
   * is a snapshot that doesn't wait, so it reads `false` if the navbar hasn't
   * rendered yet and goes down the logout branch. Each caller knows which state
   * it expects.
   */
  async clickLogin() {
    await this.loginButton.click()
  }

  async logout() {
    await this.userMenuButton.click()
    await this.page.getByTestId('navbar-menu-logout').click()
  }
}
