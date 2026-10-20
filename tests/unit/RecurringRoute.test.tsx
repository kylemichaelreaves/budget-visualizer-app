import { render, screen } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAuthState } from '@stores/authStore'

vi.mock('@api/recurring/fetchRecurringSeries', () => ({
  fetchRecurringSeries: () => Promise.resolve([]),
}))

// jsdom does not implement scrollTo; the router calls it on navigation.
window.scrollTo = () => {}

const { default: App } = await import('../../src/App')

describe('/budget-visualizer/recurring route', () => {
  beforeEach(() => {
    setAuthState('isUserAuthenticated', true)
    window.history.pushState({}, '', '/budget-visualizer/recurring')
  })
  afterEach(() => {
    setAuthState('isUserAuthenticated', false)
    window.history.pushState({}, '', '/')
  })

  it('mounts the recurring page inside the app shell', async () => {
    render(() => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <App />
      </QueryClientProvider>
    ))
    expect(await screen.findByTestId('recurring-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recurring payments' })).toBeInTheDocument()
    // Rendered within BudgetVisualizer: the sidebar's active link is Recurring.
    expect(screen.getByRole('link', { name: 'Recurring' })).toHaveClass('bg-brand')
  })
})
