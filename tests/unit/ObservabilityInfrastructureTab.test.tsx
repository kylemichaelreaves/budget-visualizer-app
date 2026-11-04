import { render, screen, fireEvent, waitFor, within } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { AxiosError, type AxiosResponse } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ObservabilityMetrics } from '@types'
import { fullMetrics, nullMetrics } from '@components/observability/infrastructure/observabilityStoryFixtures'

const fetchMock = vi.fn<(range: string) => Promise<ObservabilityMetrics>>()
vi.mock('@api/observability/fetchObservabilityMetrics', () => ({
  fetchObservabilityMetrics: (range: string) => fetchMock(range),
}))

const { default: InfrastructureTab } =
  await import('@components/observability/infrastructure/InfrastructureTab')

function renderTab() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(() => (
    <QueryClientProvider client={queryClient}>
      <InfrastructureTab range={() => '24h'} />
    </QueryClientProvider>
  ))
}

function httpError(status: number) {
  return new AxiosError('failed', 'ERR_BAD_RESPONSE', undefined, undefined, { status } as AxiosResponse)
}

describe('InfrastructureTab', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('renders every card from a full response', async () => {
    fetchMock.mockResolvedValue(fullMetrics)
    renderTab()
    const api = await screen.findByTestId('observability-api-card')
    expect(within(api).getByText('2,184')).toBeTruthy()
    expect(within(api).getByText('96 ms / 412 ms')).toBeTruthy()
    const table = screen.getByTestId('observability-lambda-table')
    const rows = within(table).getAllByTestId('observability-lambda-row')
    expect(rows.map((r) => r.querySelector('td')?.textContent)).toEqual([
      'resourceQuerier',
      'userManager',
      'authorizer',
      'transactions-bucket-to-db',
    ])
    expect(screen.getByTestId('observability-ingestion-card')).toBeTruthy()
    const rds = screen.getByTestId('observability-rds-card')
    expect(within(rds).getByText('14200.0 MB')).toBeTruthy()
  })

  it('shows — for null metrics instead of 0', async () => {
    fetchMock.mockResolvedValue(nullMetrics)
    renderTab()
    await screen.findByTestId('observability-api-card')
    for (const id of [
      'observability-api-card',
      'observability-lambda-table',
      'observability-ingestion-card',
      'observability-rds-card',
    ]) {
      const text = screen.getByTestId(id).textContent ?? ''
      expect(text).toContain('—')
      expect(text).not.toMatch(/\b0\b/)
      expect(text).not.toContain('NaN')
    }
  })

  it('renders a real 0 as 0, not —', async () => {
    fetchMock.mockResolvedValue({
      ...fullMetrics,
      lambdas: fullMetrics.lambdas.map((l) => ({ ...l, errors: 0, throttles: 0 })),
      ingestion: { dlqVisible: 0 },
      rds: { ...fullMetrics.rds, cpuPercent: 0 },
    })
    renderTab()
    await screen.findByTestId('observability-api-card')
    const rows = within(screen.getByTestId('observability-lambda-table')).getAllByTestId(
      'observability-lambda-row',
    )
    for (const row of rows) {
      const cells = row.querySelectorAll('td')
      expect(cells[3].textContent).toBe('0')
      expect(cells[5].textContent).toBe('0')
    }
    const ingestion = screen.getByTestId('observability-ingestion-card')
    expect(within(ingestion).getByText('Dead-letter queue depth').nextElementSibling?.textContent).toBe('0')
    const rds = screen.getByTestId('observability-rds-card')
    expect(within(rds).getByText('CPU').nextElementSibling?.textContent).toBe('0%')
    expect(within(rds).getByRole('progressbar')).toBeTruthy()
  })

  it('shows skeletons only on first load', () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    renderTab()
    expect(screen.getByTestId('observability-loading')).toBeTruthy()
    expect(screen.queryByTestId('observability-api-card')).toBeNull()
  })

  it('shows the forbidden state on 403', async () => {
    fetchMock.mockRejectedValue(httpError(403))
    renderTab()
    const el = await screen.findByTestId('observability-forbidden')
    expect(el.textContent).toContain("You don't have access to observability.")
    expect(screen.queryByTestId('observability-retry')).toBeNull()
  })

  it('shows an error with Retry on 502 and refetches on click', async () => {
    fetchMock.mockRejectedValue(httpError(502))
    renderTab()
    const err = await screen.findByTestId('observability-error')
    expect(err.textContent).toContain('Metrics are unavailable right now.')
    fetchMock.mockClear()
    fetchMock.mockResolvedValue(fullMetrics)
    fireEvent.click(screen.getByTestId('observability-retry'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    await screen.findByTestId('observability-api-card')
  })
})
