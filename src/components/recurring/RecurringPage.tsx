import { createMemo, Show } from 'solid-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/solid-query'
import { fetchRecurringSeries } from '@api/recurring/fetchRecurringSeries'
import { refreshRecurringSeries } from '@api/recurring/refreshRecurringSeries'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { queryKeys } from '@api/queryKeys'
import { RefreshCwIcon } from '@shared/icons'
import { Alert, AlertDescription } from '@components/ui/alert'
import { Button } from '@components/ui/button'
import { Card, CardContent } from '@components/ui/card'
import RecurringStatCards from './RecurringStatCards'
import { describeScanAge, formatScanTimestamp, latestDetectedAt, todayIso } from './recurringPageUtils'

/**
 * Recurring-payments audit page: header, stat band, and the mount points for the triage lane,
 * series table and category breakdown (Tasks 12-14).
 *
 * Two clocks, on purpose. `status` (and so the "late" state) is a snapshot from the last
 * server-side scan, whereas stopped-recency decays live. Between scans a series that fell
 * overdue is not flagged. That is only acceptable because the page says so: the header leads
 * with the last-scanned time and a primary Rescan button, and the stat band repeats the caveat.
 */
export default function RecurringPage() {
  const queryClient = useQueryClient()

  // No filters: `{}` omits every query param. (`minConfidence`, if ever added, is a 0..1 fraction.)
  const seriesQuery = useQuery(() => ({
    queryKey: queryKeys.recurring.list({}),
    queryFn: () => fetchRecurringSeries({}),
  }))

  const series = () => seriesQuery.data ?? []
  const lastScanned = createMemo(() => latestDetectedAt(series()))

  const rescan = useMutation(() => ({
    mutationFn: refreshRecurringSeries,
    // Returned so the button stays busy until the refetch lands and "last scanned" has moved.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  }))

  return (
    <div class="flex flex-col gap-6" data-testid="recurring-page">
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-foreground mt-0 mb-1 text-2xl font-semibold">Recurring payments</h2>
          <p class="text-muted-foreground m-0 text-sm">
            Subscriptions and other repeating charges detected in your transactions.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4 rounded-lg border bg-card px-4 py-3">
          <div data-testid="recurring-last-scanned">
            <p class="text-muted-foreground m-0 text-xs font-medium tracking-wider uppercase">Last scanned</p>
            <Show
              when={lastScanned()}
              fallback={
                <p
                  class="text-foreground m-0 text-lg font-semibold"
                  data-testid="recurring-last-scanned-value"
                >
                  {seriesQuery.isPending ? 'Loading…' : 'Not scanned yet'}
                </p>
              }
            >
              {(instant) => (
                <>
                  <p
                    class="text-foreground m-0 text-lg font-semibold"
                    data-testid="recurring-last-scanned-value"
                  >
                    {formatScanTimestamp(instant())}
                  </p>
                  <p class="text-muted-foreground m-0 text-xs" data-testid="recurring-last-scanned-age">
                    {describeScanAge(instant(), new Date())}
                  </p>
                </>
              )}
            </Show>
          </div>
          <Button
            type="button"
            size="lg"
            data-testid="recurring-rescan"
            disabled={rescan.isPending}
            onClick={() => rescan.mutate()}
          >
            <RefreshCwIcon class={rescan.isPending ? 'size-4 animate-spin' : 'size-4'} />
            {rescan.isPending ? 'Scanning…' : 'Rescan'}
          </Button>
        </div>
      </header>

      <Show when={rescan.isError}>
        <Alert variant="destructive" data-testid="recurring-rescan-error">
          <AlertDescription>Rescan failed: {extractApiErrorMessage(rescan.error)}</AlertDescription>
        </Alert>
      </Show>
      <Show when={rescan.isSuccess && rescan.data}>
        <p class="text-muted-foreground m-0 text-sm" role="status" data-testid="recurring-rescan-result">
          Scan complete: {rescan.data?.upserted} updated, {rescan.data?.deleted} removed.
        </p>
      </Show>

      <Show when={seriesQuery.isError}>
        <Alert variant="destructive" data-testid="recurring-load-error">
          <AlertDescription>
            Could not load recurring payments: {extractApiErrorMessage(seriesQuery.error)}
          </AlertDescription>
        </Alert>
      </Show>

      <Show when={seriesQuery.isSuccess}>
        <section class="flex flex-col gap-2" aria-label="Summary">
          <RecurringStatCards series={series()} today={todayIso()} />
          <p class="text-muted-foreground m-0 text-xs" data-testid="recurring-snapshot-note">
            Figures and statuses are as of the last scan. A payment that has gone overdue since then is not
            flagged until you rescan.
          </p>
        </section>

        <Show
          when={series().length > 0}
          fallback={
            <Card data-testid="recurring-empty-state">
              <CardContent class="pt-5 pb-4">
                <h3 class="text-foreground mt-0 mb-2 text-lg font-semibold">
                  No recurring payments detected yet
                </h3>
                <p class="text-muted-foreground m-0 text-sm">
                  This page audits what you pay on repeat: what it costs each month, which payments changed
                  price or went quiet, and which you have stopped. It builds on your memos, so press Rescan
                  above to look for payments that repeat on a regular cadence.
                </p>
              </CardContent>
            </Card>
          }
        >
          <>
            {/* TASK 12 MOUNT POINT: triage lane (series needing a decision). */}
            {/* TASK 13 MOUNT POINT: series table. */}
            {/* TASK 14 MOUNT POINT: burn-by-category breakdown. */}
          </>
        </Show>
      </Show>
    </div>
  )
}
