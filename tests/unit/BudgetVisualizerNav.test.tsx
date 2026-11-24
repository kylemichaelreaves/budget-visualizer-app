import { flush } from 'solid-js'
import { cleanup, render, screen } from '@solidjs/testing-library'
import MemoryRouterShell from '@mocks/MemoryRouterShell'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { authState, setAuthState } from '@stores/authStore'
import { normalizeUserFromApi } from '@api/users/normalizeUserFromApi'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'

describe('BudgetVisualizer sidebar', () => {
  beforeEach(() => {
    setAuthState((s) => {
      s.isUserAuthenticated = true
    })
    flush()
    setAuthState((s) => {
      s.user.role = 'user'
    })
    flush()
  })

  function renderNav() {
    render(() => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouterShell>
          <BudgetVisualizer />
        </MemoryRouterShell>
      </QueryClientProvider>
    ))
    const nav = screen.getByRole('navigation', { name: 'Sidebar navigation' })
    return Array.from(nav.querySelectorAll('a')).map((a) => [a.textContent, a.getAttribute('href')])
  }

  it('lists Recurring directly after Memos', () => {
    render(() => (
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouterShell>
          <BudgetVisualizer />
        </MemoryRouterShell>
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
    setAuthState((s) => {
      s.user.role = 'admin'
    })
    flush()
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
    setAuthState((s) => {
      s.user = user!
    })
    flush()
    expect(authState.user.role).toBe('user')
    expect(renderNav().map(([title]) => title)).not.toContain('Observability')
  })
})
