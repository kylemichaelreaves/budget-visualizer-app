import { render, screen, within } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routerState, resetRouterState } from '../setup/mockRouter'
import { setAuthState } from '@stores/authStore'
import { DEFAULT_AUTHENTICATED_ROUTE } from '@utils/authRoutes'

vi.mock('@solidjs/router', async () => (await import('../setup/mockRouter')).mockRouterModule())

const { default: AccountSettingsPage } = await import('@components/settings/AccountSettingsPage')

function setUser(user: { firstName: string; lastName: string; username: string; email: string }) {
  setAuthState('user', { id: 1, role: 'user', ...user })
}

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(() => (
    <QueryClientProvider client={client}>
      <AccountSettingsPage />
    </QueryClientProvider>
  ))
}

describe('AccountSettingsPage', () => {
  beforeEach(() => {
    resetRouterState()
  })
  afterEach(() => {
    setUser({ firstName: '', lastName: '', username: '', email: '' })
  })

  it('links back to the default authenticated route', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', DEFAULT_AUTHENTICATED_ROUTE)
  })

  it('opens on the security section by default', () => {
    renderPage()
    expect(screen.getByText('Change password')).toBeInTheDocument()
    expect(screen.getByTestId('change-password-submit')).toBeInTheDocument()
    expect(screen.queryByText('Personal information')).toBeNull()
  })

  describe('profile section', () => {
    beforeEach(() => {
      routerState.locationSearch = '?section=profile'
    })

    it('shows the full name in the profile card and the sidebar', () => {
      setUser({ firstName: 'Kyle', lastName: 'Reaves', username: 'kreaves', email: 'k@example.com' })
      renderPage()

      const sidebar = screen.getByRole('complementary')
      expect(within(sidebar).getByText('Kyle Reaves')).toBeInTheDocument()
      expect(within(sidebar).getByText('k@example.com')).toBeInTheDocument()

      // Sidebar + profile card both derive the name from the same helper.
      expect(screen.getAllByText('Kyle Reaves')).toHaveLength(2)
    })

    it('falls back to the username, and a dash for a missing email, everywhere the name appears', () => {
      setUser({ firstName: '', lastName: '', username: 'kreaves', email: '' })
      renderPage()

      expect(screen.getAllByText('kreaves')).toHaveLength(2)
      expect(screen.getAllByText('—')).toHaveLength(2)
    })

    it('uses a lone first name without a trailing space', () => {
      setUser({ firstName: 'Kyle', lastName: '', username: 'kreaves', email: 'k@example.com' })
      renderPage()

      expect(screen.getAllByText('Kyle', { exact: true })).toHaveLength(2)
    })
  })
})
