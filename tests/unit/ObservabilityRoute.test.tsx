import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObservabilityMetrics } from '@types'
import { setAuthState } from '@stores/authStore'
import { fullMetrics } from '@components/observability/infrastructure/observabilityStoryFixtures'

const fetchMock = vi.fn<(range: string) => Promise<ObservabilityMetrics>>()
vi.mock('@api/observability/fetchObservabilityMetrics', () => ({
  fetchObservabilityMetrics: (range: string) => fetchMock(range),
}))

// The redirect target renders the real transactions table, which needs ResizeObserver; stub it out.
vi.mock('@components/transactions/table/TransactionsTable', () => ({
  default: () => <div data-testid="transactions-stub" />,
}))

// jsdom does not implement scrollTo; the router calls it on navigation.
window.scrollTo = () => {}

const { default: App } = await import('../../src/App')

function renderApp() {
  return render(() => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <App />
    </QueryClientProvider>
  ))
}

describe('/budget-visualizer/observability route', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue(fullMetrics)
    setAuthState('isUserAuthenticated', true)
    setAuthState('user', 'role', 'admin')
    window.history.pushState({}, '', '/budget-visualizer/observability')
  })
  afterEach(() => {
    cleanup()
    setAuthState('isUserAuthenticated', false)
    setAuthState('user', 'role', 'guest')
    window.history.pushState({}, '', '/')
  })

  it('redirects a non-admin to transactions', async () => {
    setAuthState('user', 'role', 'user')
    renderApp()
    await waitFor(() => expect(window.location.pathname).toBe('/budget-visualizer/transactions'))
    expect(screen.queryByTestId('observability-page')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('renders the page for an admin', async () => {
    renderApp()
    expect(await screen.findByTestId('observability-page')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Observability' })).toBeInTheDocument()
    expect(await screen.findByTestId('observability-api-card')).toBeInTheDocument()
    expect(screen.getByTestId('observability-refresh')).toBeInTheDocument()
  })

  it('falls back to 24h for ?range=banana', async () => {
    window.history.pushState({}, '', '/budget-visualizer/observability?range=banana')
    renderApp()
    const item = await screen.findByTestId('observability-range-24h')
    expect(item).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('24h'))
  })

  it('writes the chosen range to the URL', async () => {
    renderApp()
    fireEvent.click(await screen.findByTestId('observability-range-7d'))
    await waitFor(() => expect(window.location.search).toBe('?range=7d'))
    expect(screen.getByTestId('observability-range-7d')).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('7d'))
  })
})
