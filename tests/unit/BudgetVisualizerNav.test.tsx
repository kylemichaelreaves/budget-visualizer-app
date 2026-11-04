import { cleanup, render, screen } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { authState, setAuthState } from '@stores/authStore'
import { normalizeUserFromApi } from '@api/users/normalizeUserFromApi'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'

describe('BudgetVisualizer sidebar', () => {
  beforeEach(() => {
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'role', 'user')
  })

  function renderNav() {
    render(() => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter root={BudgetVisualizer}>
          <Route path="*" component={() => null} />
        </MemoryRouter>
      </QueryClientProvider>
    ))
    const nav = screen.getByRole('navigation', { name: 'Sidebar navigation' })
    return Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])
  }

  it('lists Recurring directly after Memos', () => {
    render(() => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter root={BudgetVisualizer}>
          <Route path="*" component={() => null} />
        </MemoryRouter>
      </QueryClientProvider>
    ))
    const nav = screen.getByRole('navigation', { name: 'Sidebar navigation' })
    const links = Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])
    const memos = links.findIndex(([title]) => title === 'Memos')
    expect(memos).toBeGreaterThanOrEqual(0)
    expect(links[memos + 1]).toEqual(['Recurring', '/budget-visualizer/recurring'])
  })

  it('shows the Admin section only to admins', () => {
    expect(renderNav().map(([title]) => title)).not.toContain('Observability')
    cleanup()
    setAuthState('user', 'role', 'admin')
    const links = renderNav()
    expect(links[links.length - 1]).toEqual(['Observability', '/budget-visualizer/observability'])
    expect(screen.getByTestId('sidebar-admin-observability')).toBeInTheDocument()
  })

  it('hides Admin for a stored user without a role', () => {
    const user = normalizeUserFromApi({
      id: 1,
      firstName: 'A',
      lastName: 'B',
      username: 'ab',
      email: 'a@b.c',
    })
    expect(user).not.toBeNull()
    setAuthState('user', user!)
    expect(authState.user.role).toBe('user')
    expect(renderNav().map(([title]) => title)).not.toContain('Observability')
  })
})
