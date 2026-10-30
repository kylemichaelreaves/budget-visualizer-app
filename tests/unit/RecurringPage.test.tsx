import { render, screen, waitFor, fireEvent, within } from '@solidjs/testing-library'
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mutationKeys } from '@api/queryKeys'
import type { RecurringRefreshResult, RecurringSeries } from '@types'
import { expectNoLiteralColours } from '../setup/expectNoLiteralColours'
import { makeRecurringSeries as makeSeries } from '../setup/makeRecurringSeries'

const fetchMock = vi.fn<(filters: object) => Promise<RecurringSeries[]>>()
const refreshMock = vi.fn<() => Promise<RecurringRefreshResult>>()

vi.mock('@api/recurring/fetchRecurringSeries', () => ({
  fetchRecurringSeries: (filters: object) => fetchMock(filters),
}))
vi.mock('@api/recurring/refreshRecurringSeries', () => ({
  refreshRecurringSeries: () => refreshMock(),
}))

const { default: RecurringPage } = await import('@components/recurring/RecurringPage')
const { STALE_SCAN_DAYS } = await import('@components/recurring/recurringPageUtils')

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')
  render(() => (
    <QueryClientProvider client={queryClient}>
      <RecurringPage />
    </QueryClientProvider>
  ))
  return { invalidate, queryClient }
}

const NOW = new Date('2026-10-20T15:00:00.000Z')
const DAY_MS = 86_400_000
const agoIso = (ms: number) => new Date(NOW.getTime() - ms).toISOString()

const lastScanned = () => screen.getByTestId('recurring-last-scanned-value')

describe('RecurringPage', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    refreshMock.mockReset()
    // Pin "now" so staleness and relative ages are deterministic. Only Date is faked.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('loads the series including dismissed ones, so dismissal cannot remove a series from the totals', async () => {
    fetchMock.mockResolvedValue([makeSeries()])
    renderPage()
    await screen.findByTestId('recurring-stat-cards')
    expect(fetchMock).toHaveBeenCalledWith({ includeDismissed: true })
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

    it('registers the rescan under mutationKeys.refreshRecurring', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      refreshMock.mockReturnValue(new Promise(() => {}))
      const { queryClient } = renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(queryClient.isMutating({ mutationKey: mutationKeys.refreshRecurring })).toBe(0)
      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))
      await screen.findByRole('button', { name: 'Scanning…' })
      expect(queryClient.isMutating({ mutationKey: mutationKeys.refreshRecurring })).toBe(1)
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

    it('shows a loading skeleton while the series load, and removes it afterwards', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      renderPage()
      expect(screen.getByTestId('recurring-loading')).toHaveAttribute('aria-busy', 'true')
      await screen.findByTestId('recurring-stat-cards')
      expect(screen.queryByTestId('recurring-loading')).not.toBeInTheDocument()
    })

    it('raises the load error with the negative tokens so it reads as an alert in both themes', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))
      renderPage()
      const alert = await screen.findByTestId('recurring-load-error')
      expect(screen.queryByTestId('recurring-loading')).not.toBeInTheDocument()
      expect(alert).toHaveClass('border-negative', 'bg-negative-muted', 'text-negative-emphasis')
      expect(alert.querySelector('svg')).not.toBeNull()
    })

    it('shows a load error instead of a misleading empty page', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))
      renderPage()
      expect(await screen.findByTestId('recurring-load-error')).toHaveTextContent('network down')
      expect(screen.queryByTestId('recurring-empty-state')).not.toBeInTheDocument()
      expect(screen.queryByTestId('recurring-stat-cards')).not.toBeInTheDocument()
      // We cannot know the scan state, so the header must not claim "Not scanned yet".
      expect(lastScanned()).toHaveTextContent('Unavailable')
      expect(lastScanned()).not.toHaveTextContent(/not scanned yet/i)
      expect(screen.getByTestId('recurring-last-scanned-age')).toHaveTextContent(
        'Could not load scan status.',
      )
      expect(screen.queryByTestId('recurring-totals')).not.toBeInTheDocument()
    })
  })

  describe('last-scanned states with no scan time', () => {
    it('says "Not scanned yet" for an empty list with no scan on record', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      expect(lastScanned()).toHaveTextContent('Not scanned yet')
    })

    it('says a scan found nothing, not "Not scanned yet", after a rescan returns no series', async () => {
      fetchMock.mockResolvedValue([])
      refreshMock.mockResolvedValue({ upserted: 0, deleted: 0 })
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))
      await waitFor(() => expect(lastScanned()).toHaveTextContent('None detected'))
      expect(lastScanned()).not.toHaveTextContent(/not scanned yet/i)
      expect(screen.getByTestId('recurring-last-scanned-age')).toHaveTextContent(
        'The last scan found no recurring payments.',
      )
    })

    it('does not show the "found nothing" message when the rescan itself failed', async () => {
      fetchMock.mockResolvedValue([])
      refreshMock.mockRejectedValue(new Error('boom'))
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))
      await screen.findByTestId('recurring-rescan-error')
      expect(lastScanned()).toHaveTextContent('Not scanned yet')
    })
  })

  describe('staleness cue', () => {
    const note = () => screen.getByTestId('recurring-snapshot-note')

    async function renderScannedAgo(ms: number) {
      fetchMock.mockResolvedValue([makeSeries({ detectedAt: agoIso(ms) })])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
    }

    it('stays quiet for a fresh scan', async () => {
      await renderScannedAgo(60_000)
      expect(note()).toHaveClass('text-muted-foreground', 'text-xs')
      expect(note()).not.toHaveClass('text-caution-foreground')
      expect(note()).toHaveAttribute('data-stale', 'false')
      expect(note()).not.toHaveTextContent(/the last scan was/i)
    })

    it('stays quiet at exactly 7 days', async () => {
      await renderScannedAgo(STALE_SCAN_DAYS * DAY_MS)
      expect(note()).not.toHaveClass('text-caution-foreground')
    })

    it('escalates to the caution tone once the scan is more than 7 days old', async () => {
      await renderScannedAgo(STALE_SCAN_DAYS * DAY_MS + 60_000)
      expect(note()).toHaveClass('text-caution-foreground', 'font-medium')
      expect(note()).not.toHaveClass('text-muted-foreground')
      expect(note()).toHaveAttribute('data-stale', 'true')
    })

    it('says how old the scan is and keeps the rescan instruction', async () => {
      await renderScannedAgo(21 * DAY_MS)
      expect(note()).toHaveTextContent('The last scan was 21 days ago.')
      expect(note()).toHaveTextContent(/not flagged until you rescan/i)
    })

    it('measures staleness from the newest series, not the oldest', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ detectedAt: agoIso(30 * DAY_MS) }),
        makeSeries({ detectedAt: agoIso(DAY_MS) }),
      ])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(note()).toHaveAttribute('data-stale', 'false')
    })
  })

  describe('header counts', () => {
    it('shows the series count and the summed occurrences as the transaction count', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ occurrenceCount: 6 }),
        makeSeries({ occurrenceCount: 12 }),
        makeSeries({ occurrenceCount: 4 }),
        makeSeries({ occurrenceCount: 100, dismissedAt: '2026-10-01T00:00:00.000Z' }),
      ])
      renderPage()
      expect(await screen.findByTestId('recurring-totals')).toHaveTextContent(
        '4 series across 122 transactions',
      )
    })

    it('counts a dismissed series in the header, matching the stat cards', async () => {
      const dismissedAt = '2026-10-01T00:00:00.000Z'
      fetchMock.mockResolvedValue([
        makeSeries({ occurrenceCount: 6 }),
        makeSeries({ occurrenceCount: 6, dismissedAt }),
        makeSeries({ occurrenceCount: 6, status: 'stopped' }),
        makeSeries({ occurrenceCount: 6, status: 'stopped', dismissedAt }),
      ])
      renderPage()
      const header = await screen.findByTestId('recurring-totals')
      const active = Number(screen.getByTestId('recurring-stat-active-value').textContent)
      const stopped = Number(screen.getByTestId('recurring-stat-stopped-value').textContent)
      expect([active, stopped]).toEqual([2, 2])
      // No overdue series in this fixture, so every series is Active or Stopped: the figures must agree.
      expect(header).toHaveTextContent(`${active + stopped} series across 24 transactions`)
    })

    it('pluralises a single transaction', async () => {
      fetchMock.mockResolvedValue([makeSeries({ occurrenceCount: 1 })])
      renderPage()
      expect(await screen.findByTestId('recurring-totals')).toHaveTextContent('1 series across 1 transaction')
      expect(screen.getByTestId('recurring-totals')).not.toHaveTextContent(/transactions/)
    })
  })

  describe('triage lane', () => {
    it('mounts the lane with the series that need a decision', async () => {
      const flagged = makeSeries({ status: 'overdue', nextExpectedDate: '2026-10-10' })
      const healthy = makeSeries()
      fetchMock.mockResolvedValue([flagged, healthy])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(screen.getByTestId('recurring-triage-lane')).toBeInTheDocument()
      expect(screen.getByTestId(`recurring-triage-card-${flagged.id}`)).toHaveAttribute('data-state', 'late')
      expect(screen.queryByTestId(`recurring-triage-card-${healthy.id}`)).toBeNull()
    })

    it('leaves no lane when nothing needs a decision', async () => {
      fetchMock.mockResolvedValue([makeSeries()])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(screen.queryByTestId('recurring-triage-lane')).toBeNull()
    })

    it("passes the page's own today to the lane, so a stopped series ages out of it", async () => {
      // Pinned "now" is 20 Oct 2026. Monthly: a stopped series lingers ~122 days past its expected date.
      const recent = makeSeries({ status: 'stopped', lastDate: '2026-07-15', nextExpectedDate: '2026-09-01' })
      const old = makeSeries({ status: 'stopped', lastDate: '2026-03-15', nextExpectedDate: '2026-04-15' })
      fetchMock.mockResolvedValue([recent, old])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expect(screen.getByTestId(`recurring-triage-card-${recent.id}`)).toBeInTheDocument()
      expect(screen.queryByTestId(`recurring-triage-card-${old.id}`)).toBeNull()
    })

    it('is not rendered in the empty state', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      expect(screen.queryByTestId('recurring-triage-lane')).toBeNull()
    })
  })

  describe('series table', () => {
    it('mounts the table with one row per series', async () => {
      const a = makeSeries({ memoName: 'Netflix' })
      const b = makeSeries({ memoName: 'Gym', status: 'overdue', nextExpectedDate: '2026-10-10' })
      fetchMock.mockResolvedValue([a, b])
      renderPage()
      const table = await screen.findByTestId('recurring-table')
      expect(within(table).getByTestId(`recurring-table-row-${a.id}`)).toHaveTextContent('Netflix')
      expect(within(table).getByTestId(`recurring-table-row-${b.id}`)).toHaveTextContent('Gym')
      expect(within(table).getAllByRole('row')).toHaveLength(3) // header + 2
    })

    it('lists dismissed series, marked, so the table agrees with the stat cards that count them', async () => {
      const dismissed = makeSeries({
        memoName: 'Gym',
        monthlyNormalized: 30,
        dismissedAt: '2026-10-01T02:30:00.000Z',
      })
      const live = makeSeries({ memoName: 'Netflix', monthlyNormalized: 10 })
      fetchMock.mockResolvedValue([dismissed, live])
      renderPage()
      await screen.findByTestId('recurring-table')

      const dismissedRow = screen.getByTestId(`recurring-table-row-${dismissed.id}`)
      expect(dismissedRow).toHaveAttribute('data-dismissed', 'true')
      expect(within(dismissedRow).getByTestId('recurring-table-dismissed')).toBeInTheDocument()
      // The headline counts the dismissed series; so does the table.
      expect(screen.getByTestId('recurring-stat-burn-value')).toHaveTextContent('$40.00')
    })

    it('has per-month figures that sum to the headline burn', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ monthlyNormalized: 15.99 }),
        makeSeries({ monthlyNormalized: 1.005, dismissedAt: '2026-10-01T02:30:00.000Z' }),
        makeSeries({ monthlyNormalized: 7.5, cadence: 'weekly', latestAmount: 1.73 }),
        makeSeries({ monthlyNormalized: 99, status: 'stopped' }),
      ])
      renderPage()
      await screen.findByTestId('recurring-table')

      const cents = screen
        .getAllByTestId('recurring-table-monthly')
        .map((el) => el.textContent ?? '')
        .filter((text) => text.startsWith('$'))
        .reduce((sum, text) => sum + Math.round(Number(text.replace(/[$,]/g, '')) * 100), 0)
      expect(screen.getByTestId('recurring-stat-burn-value')).toHaveTextContent(
        `$${(cents / 100).toFixed(2)}`,
      )
      expect(cents).toBe(1599 + 101 + 750)
    })

    it('is not rendered in the empty state', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      expect(screen.queryByTestId('recurring-table')).toBeNull()
    })

    it('is not rendered while the series are still loading', () => {
      fetchMock.mockReturnValue(new Promise(() => {}))
      renderPage()
      expect(screen.queryByTestId('recurring-table')).toBeNull()
    })
  })

  describe('category breakdown', () => {
    it('mounts the section below the table, open, with one row per category', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ budgetCategory: 'Software', monthlyNormalized: 30 }),
        makeSeries({ budgetCategory: 'Food', monthlyNormalized: 10 }),
      ])
      renderPage()
      const section = await screen.findByTestId('recurring-category-breakdown')
      expect(within(section).getByTestId('recurring-breakdown-details')).toHaveAttribute('open')
      expect(within(section).getAllByTestId('recurring-breakdown-row')).toHaveLength(2)
      expect(within(section).getByRole('img')).toHaveAccessibleName(/Software 75\.0%, Food 25\.0%/)
      const table = screen.getByTestId('recurring-table')
      expect(table.compareDocumentPosition(section) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('names the same burn total as the stat card it explains', async () => {
      fetchMock.mockResolvedValue([
        makeSeries({ budgetCategory: 'Software', monthlyNormalized: 15.99 }),
        makeSeries({ budgetCategory: null, monthlyNormalized: 1.005 }),
        makeSeries({ budgetCategory: 'Food', monthlyNormalized: 7.5, cadence: 'weekly' }),
        makeSeries({ budgetCategory: 'Gone', monthlyNormalized: 99, status: 'stopped' }),
      ])
      renderPage()
      const section = await screen.findByTestId('recurring-category-breakdown')
      const burn = screen.getByTestId('recurring-stat-burn-value').textContent
      expect(within(section).getByTestId('recurring-breakdown-total')).toHaveTextContent(burn as string)
      const cents = within(section)
        .getAllByTestId('recurring-breakdown-amount')
        .reduce((sum, el) => sum + Math.round(Number((el.textContent ?? '').replace(/[$,]/g, '')) * 100), 0)
      expect(cents).toBe(1599 + 101 + 750)
      expect(burn).toBe('$24.50')
    })

    it('counts a dismissed series, as the headline does', async () => {
      const dismissed = makeSeries({
        memoName: 'Gym',
        budgetCategory: 'Health',
        monthlyNormalized: 30,
        dismissedAt: '2026-10-01T02:30:00.000Z',
      })
      fetchMock.mockResolvedValue([dismissed, makeSeries({ budgetCategory: 'Food', monthlyNormalized: 10 })])
      renderPage()
      const section = await screen.findByTestId('recurring-category-breakdown')
      expect(within(section).getByTestId('recurring-breakdown-total')).toHaveTextContent('$40.00')
      expect(screen.getByTestId('recurring-stat-burn-value')).toHaveTextContent('$40.00')
      expect(within(section).getAllByTestId('recurring-breakdown-row')).toHaveLength(2)
    })

    it('is scoped to its own section: a memo name shown in the lane and table is not ambiguous here', async () => {
      // "Late Co" appears in the triage lane and the table. Neither is the breakdown, which lists
      // categories, so a query scoped to the section finds the category and never the memo.
      const late = makeSeries({
        memoName: 'Late Co',
        budgetCategory: 'Bills',
        status: 'overdue',
        nextExpectedDate: '2026-10-10',
      })
      fetchMock.mockResolvedValue([late])
      renderPage()
      const section = await screen.findByTestId('recurring-category-breakdown')
      expect(screen.getAllByText('Late Co').length).toBeGreaterThan(1)
      expect(within(section).queryByText('Late Co')).toBeNull()
      expect(within(section).getByText('Bills')).toBeInTheDocument()
    })

    it('shows its own empty state when every series is stopped', async () => {
      fetchMock.mockResolvedValue([makeSeries({ status: 'stopped' })])
      renderPage()
      const section = await screen.findByTestId('recurring-category-breakdown')
      expect(within(section).getByTestId('recurring-breakdown-empty')).toBeInTheDocument()
    })

    it('is not rendered in the page empty state', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      expect(screen.queryByTestId('recurring-category-breakdown')).toBeNull()
    })

    it('is not rendered while the series are still loading', () => {
      fetchMock.mockReturnValue(new Promise(() => {}))
      renderPage()
      expect(screen.queryByTestId('recurring-category-breakdown')).toBeNull()
    })
  })

  describe('colours come from design tokens', () => {
    it('carries no literal colour in the header, panel, notes or stat band (fresh scan)', async () => {
      fetchMock.mockResolvedValue([makeSeries({ detectedAt: agoIso(60_000) })])
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      expectNoLiteralColours(screen.getByTestId('recurring-page').outerHTML)
    })

    it('carries no literal colour with the stale caution note and rescan states showing', async () => {
      fetchMock.mockResolvedValue([makeSeries({ detectedAt: agoIso(30 * DAY_MS) })])
      refreshMock.mockRejectedValue(new Error('boom'))
      renderPage()
      await screen.findByTestId('recurring-stat-cards')
      fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))
      await screen.findByTestId('recurring-rescan-error')
      expect(screen.getByTestId('recurring-snapshot-note')).toHaveAttribute('data-stale', 'true')
      expectNoLiteralColours(screen.getByTestId('recurring-page').outerHTML)
    })

    it('carries no literal colour in the empty state', async () => {
      fetchMock.mockResolvedValue([])
      renderPage()
      await screen.findByTestId('recurring-empty-state')
      expectNoLiteralColours(screen.getByTestId('recurring-page').outerHTML)
    })

    it('carries no literal colour in the load-error state', async () => {
      fetchMock.mockRejectedValue(new Error('network down'))
      renderPage()
      await screen.findByTestId('recurring-load-error')
      expectNoLiteralColours(screen.getByTestId('recurring-page').outerHTML)
    })
  })
})
