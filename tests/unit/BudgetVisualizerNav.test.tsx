import { render, screen } from '@solidjs/testing-library'
import { MemoryRouter, Route } from '@solidjs/router'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { beforeEach, describe, expect, it } from 'vitest'
import { setAuthState } from '@stores/authStore'
import BudgetVisualizer from '@components/layout/BudgetVisualizer'

describe('BudgetVisualizer sidebar', () => {
  beforeEach(() => {
    setAuthState('isUserAuthenticated', true)
  })

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
})
