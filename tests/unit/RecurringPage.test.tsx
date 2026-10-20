import { render, screen, waitFor, fireEvent } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecurringRefreshResult, RecurringSeries } from '@types'

const fetchMock = vi.fn<(filters: object) => Promise<RecurringSeries[]>>()
const refreshMock = vi.fn<() => Promise<RecurringRefreshResult>>()

vi.mock('@api/recurring/fetchRecurringSeries', () => ({
  fetchRecurringSeries: (filters: object) => fetchMock(filters),
}))
vi.mock('@api/recurring/refreshRecurringSeries', () => ({
  refreshRecurringSeries: () => refreshMock(),
}))

const { default: RecurringPage } = await import('@components/recurring/RecurringPage')

let nextId = 1

function makeSeries(overrides: Partial<RecurringSeries> = {}): RecurringSeries {
  const id = nextId++
  return {
    id,
    memoId: id,
    memoName: `Memo ${id}`,
    avatarS3Url: null,
    cadence: 'monthly',
    confidence: 0.9,
    occurrenceCount: 6,
    firstDate: '2026-04-15',
    lastDate: '2026-10-15',
    nextExpectedDate: '2026-11-15',
    latestAmount: 10,
    monthlyNormalized: 10,
    amountHistory: [
      { date: '2026-09-15', amount: 10 },
      { date: '2026-10-15', amount: 10 },
    ],
    budgetCategory: 'Entertainment',
    status: 'active',
    dismissedAt: null,
    detectedAt: '2026-10-19T03:00:00.000Z',
    memoRecurring: true,
    memoFrequency: 'monthly',
    ...overrides,
  }
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(() => (
    <QueryClientProvider client={queryClient}>
      <RecurringPage />
    </QueryClientProvider>
  ))
  return { invalidate }
}

const lastScanned = () => screen.getByTestId('recurring-last-scanned-value')

describe('RecurringPage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    refreshMock.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('loads the series without filters', async () => {
    fetchMock.mockResolvedValue([makeSeries()])
    renderPage()
    await screen.findByTestId('recurring-stat-cards')
    expect(fetchMock).toHaveBeenCalledWith({})
  })

  describe('last scanned', () => {
    it('shows the newest detectedAt across all series, in local time', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ detectedAt: '2026-10-19T03:00:00.000Z' }),
        makeSeries({ detectedAt: '2026-10-20T14:30:00.000Z' }),
        makeSeries({ detectedAt: '2026-10-18T03:00:00.000Z' }),
      ])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      // 14:30Z is 10:30 EDT. The older instants would render as 18 or 19 Oct.
      expect(lastScanned()).toHaveTextContent('20 Oct 2026, 10:30')
      expect(screen.getByTestId('recurring-last-scanned')).toHaveTextContent(/last scanned/i)
    })

    it('says so when nothing has been scanned', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      expect(lastScanned()).toHaveTextContent('Not scanned yet')
    })

    it('does not claim "not scanned" while still loading', () => {
      fetchMock.mockReturnValue(new Promise(() => {}))
      renderPage()
      expect(lastScanned()).toHaveTextContent('Loading…')
      expect(screen.queryByTestId('recurring-stat-cards')).not.toBeInTheDocument()
    })

    it('tells the reader the figures are a snapshot', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      renderPage()
      expect(await screen.findByTestId('recurring-snapshot-note')).toHaveTextContent(
        /as of the last scan.*not flagged until you rescan/i,
      )
    })
  })

  describe('rescan', () => {
    it('is a prominent, primary-variant button, available even with no series', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      const button = screen.getByRole('button', { name: 'Rescan' })
      expect(button).toBeEnabled()
      expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
    })

    it('rescans, invalidates the recurring queries, refetches and moves "last scanned"', async () => {
      fetchMock
        .mockResolvedValueOnce([makeSeries({ detectedAt: '2026-10-19T03:00:00.000Z' })])
        .mockResolvedValueOnce([makeSeries({ detectedAt: '2026-10-20T14:30:00.000Z' })])
      refreshMock.mockResolvedValue({ upserted: 4, deleted: 1 })
      const { invalidate } = renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(lastScanned()).toHaveTextContent('18 Oct 2026, 23:00')

      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))

      await waitFor(() => expect(lastScanned()).toHaveTextContent('20 Oct 2026, 10:30'))
      expect(refreshMock).toHaveBeenCalledTimes(1)
      expect(invalidate).toHaveBeenCalledWith({ queryKey: ['recurring'] })
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(await screen.findByTestId('recurring-rescan-result')).toHaveTextContent(
        'Scan complete: 4 updated, 1 removed.',
      )
    })

    it('is disabled and labelled while the scan is running', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      refreshMock.mockReturnValue(new Promise(() => {}))
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))
      const busy = await screen.findByRole('button', { name: 'Scanning…' })
      expect(busy).toBeDisabled()
    })

    it('shows the failure and leaves the loaded data alone', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      refreshMock.mockRejectedValue(new Error('upstream exploded'))
      const { invalidate } = renderPage()
      await screen.findByTestId('recurring-stat-cards')

      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))

      expect(await screen.findByTestId('recurring-rescan-error')).toHaveTextContent(
        'Rescan failed: upstream exploded',
      )
      expect(invalidate).not.toHaveBeenCalled()
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button', { name: 'Rescan' })).toBeEnabled()
    })
  })

  describe('states', () => {
    it('explains what the page is for when no series are detected', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      const empty = await screen.findByTestId('recurring-empty-state')
      expect(empty).toHaveTextContent('No recurring payments detected yet')
      expect(empty).toHaveTextContent(/what you pay on repeat/i)
      expect(empty).toHaveTextContent(/Rescan/)
      // The stat band still renders, zeroed.
      expect(screen.getByTestId('recurring-stat-burn-value')).toHaveTextContent('$0.00')
    })

    it('hides the empty state once there are series', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(screen.queryByTestId('recurring-empty-state')).not.toBeInTheDocument()
    })

    it('feeds the stat band from the loaded series', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ monthlyNormalized: 12.5 }),
        makeSeries({ monthlyNormalized: 7.5 }),
      ])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(screen.getByTestId('recurring-stat-burn-value')).toHaveTextContent('$20.00')
      expect(screen.getByTestId('recurring-stat-active-value')).toHaveTextContent('2')
    })

    it('shows a load error instead of a misleading empty page', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))
      renderPage()
      expect(await screen.findByTestId('recurring-load-error')).toHaveTextContent('network down')
      expect(screen.queryByTestId('recurring-empty-state')).not.toBeInTheDocument()
      expect(screen.queryByTestId('recurring-stat-cards')).not.toBeInTheDocument()
    })
  })
})
