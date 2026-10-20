import { createMemo, For, Show } from 'solid-js'
import { Badge } from '@components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table'
import { formatUsdAbs } from '@utils/formatUsd'
import type { RecurringCadence, RecurringSeries, RecurringStatus } from '@types'
import { formatSeriesDate, monthlyAmount } from './createRecurringDerivedData'
import RecurringAvatar from './RecurringAvatar'
import RecurringSparkline from './RecurringSparkline'

const DASH = '—'

const CADENCE_LABEL: Record<RecurringCadence, string> = {
  weekly: 'Weekly',
  biweekly: 'Biweekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

interface StatusStyle {
  label: string
  /** Tinted badge: the state's muted token behind its on-muted text token. */
  badge: string
}

// Complete class strings, never assembled, so Tailwind can see them.
const STATUS_STYLES: Record<RecurringStatus, StatusStyle> = {
  active: { label: 'Active', badge: 'bg-secondary text-secondary-foreground' },
  overdue: { label: 'Late', badge: 'bg-caution-muted text-caution-on-muted' },
  stopped: { label: 'Stopped', badge: 'bg-muted text-muted-foreground' },
}

/**
 * `overdue` is the server's stored status and `stopped` is a stored status too, so both describe
 * the last scan, not today. The caption keeps a stale snapshot from being read as current truth.
 * It matches the triage lane's wording.
 */
const AS_OF_SCAN: ReadonlySet<RecurringStatus> = new Set<RecurringStatus>(['overdue', 'stopped'])

/** Below this a detection is shown as weak, in a caution colour as well as a short bar. */
const WEAK_CONFIDENCE = 0.6
const BAR_WIDTH = 100

const clampUnit = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

function ConfidenceMeter(props: { confidence: number }) {
  const value = () => clampUnit(props.confidence)
  const weak = () => value() < WEAK_CONFIDENCE
  return (
    <span class="inline-flex items-center justify-end gap-2">
      <svg
        viewBox={`0 0 ${BAR_WIDTH} 6`}
        width="48"
        height="6"
        aria-hidden="true"
        data-testid="recurring-table-confidence-meter"
        data-weak={weak()}
        class={weak() ? 'text-caution' : 'text-primary'}
      >
        <rect width={BAR_WIDTH} height="6" rx="3" fill="currentColor" class="text-muted" />
        <rect
          width={Number((value() * BAR_WIDTH).toFixed(2))}
          height="6"
          rx="3"
          fill="currentColor"
          data-testid="recurring-table-confidence-bar"
        />
      </svg>
      <span class="text-foreground text-sm">{Math.round(value() * 100)}%</span>
    </span>
  )
}

function SeriesRow(props: { series: () => RecurringSeries }) {
  const s = () => props.series()
  const stopped = () => s().status === 'stopped'
  const dismissed = () => s().dismissedAt !== null && s().dismissedAt !== undefined
  const status = () => STATUS_STYLES[s().status]
  const memoName = () => s().memoName?.trim() || 'Unnamed memo'

  return (
    <TableRow
      data-testid={`recurring-table-row-${s().id}`}
      data-status={s().status}
      data-dismissed={dismissed()}
      class={stopped() ? 'opacity-60' : undefined}
    >
      <TableCell data-testid="recurring-table-memo">
        <div class="flex items-center gap-3">
          <RecurringAvatar memoName={s().memoName} avatarS3Url={s().avatarS3Url} />
          <div class="flex min-w-0 flex-col">
            <span class="text-foreground truncate font-medium" data-testid="recurring-table-row-name">
              {memoName()}
            </span>
            <span class="text-muted-foreground truncate text-xs">
              {s().budgetCategory ?? 'Uncategorized'}
            </span>
          </div>
        </div>
      </TableCell>
      <TableCell data-testid="recurring-table-cadence">
        <Badge variant="secondary">{CADENCE_LABEL[s().cadence] ?? s().cadence}</Badge>
      </TableCell>
      <TableCell class="text-right tabular-nums" data-testid="recurring-table-latest">
        {formatUsdAbs(s().latestAmount)}
      </TableCell>
      <TableCell class="text-right tabular-nums" data-testid="recurring-table-monthly">
        {stopped() ? DASH : formatUsdAbs(monthlyAmount(s()))}
      </TableCell>
      <TableCell data-testid="recurring-table-history">
        <RecurringSparkline history={s().amountHistory ?? []} stopped={stopped()} />
      </TableCell>
      <TableCell class="tabular-nums" data-testid="recurring-table-next">
        {stopped() || !s().nextExpectedDate ? DASH : formatSeriesDate(s().nextExpectedDate as string)}
      </TableCell>
      <TableCell data-testid="recurring-table-status">
        <div class="flex flex-col items-start gap-1">
          <div class="flex items-center gap-1">
            <Badge variant="outline" class={`border-transparent ${status().badge}`}>
              {status().label}
            </Badge>
            {/* Dismissed means "stop flagging this", not "stop counting this": mark it, never hide it. */}
            <Show when={dismissed()}>
              <Badge
                variant="outline"
                class="text-muted-foreground"
                data-testid="recurring-table-dismissed"
                title="No longer flagged for review"
              >
                Dismissed
              </Badge>
            </Show>
          </div>
          <Show when={AS_OF_SCAN.has(s().status)}>
            <span
              class="text-muted-foreground text-xs"
              data-testid="recurring-table-as-of-scan"
              title="Status from the last scan. Rescan to refresh it."
            >
              As of last scan
            </span>
          </Show>
        </div>
      </TableCell>
      <TableCell class="text-right tabular-nums" data-testid="recurring-table-confidence">
        <ConfidenceMeter confidence={s().confidence} />
      </TableCell>
    </TableRow>
  )
}

/**
 * Every detected series, dismissed ones included and marked, with its price history as a
 * sparkline. Dismissal silences the triage lane only, so hiding a dismissed series here would
 * contradict the stat cards that still count it.
 *
 * Rows are keyed by `series.id`, not by object: a refetch hands back new objects for the same
 * series, and keying by reference would remount every row (losing any local row state).
 * Per-month figures come from `monthlyAmount`, so the rows sum to the headline.
 */
export default function RecurringTable(props: { series: RecurringSeries[] }) {
  // Stopped rows sink to the bottom, API order kept within each group (`filter` is stable). The
  // backend orders by monthly amount, but a stopped row shows a dash there, so left in place it
  // would interleave among live rows by a number the table never shows. Not re-sorted by amount.
  const ordered = createMemo(() => [
    ...props.series.filter((s) => s.status !== 'stopped'),
    ...props.series.filter((s) => s.status === 'stopped'),
  ])
  const ids = createMemo(() => ordered().map((s) => s.id))
  const byId = createMemo(() => new Map(ordered().map((s) => [s.id, s])))

  return (
    <section
      class="flex flex-col gap-3"
      aria-labelledby="recurring-table-heading"
      data-testid="recurring-table"
    >
      <h3 id="recurring-table-heading" class="text-foreground m-0 text-lg font-semibold">
        All recurring payments
      </h3>
      <Show
        when={props.series.length > 0}
        fallback={
          <p class="text-muted-foreground m-0 text-sm" data-testid="recurring-table-empty">
            No recurring payments to list.
          </p>
        }
      >
        <div class="rounded-lg border bg-card">
          <Table class="min-w-[56rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Memo</TableHead>
                <TableHead>Cadence</TableHead>
                <TableHead class="text-right">Latest</TableHead>
                <TableHead class="text-right">Per month</TableHead>
                <TableHead>Amount history</TableHead>
                <TableHead>Next expected</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={ids()}>
                {(id) => <Show when={byId().get(id)}>{(series) => <SeriesRow series={series} />}</Show>}
              </For>
            </TableBody>
          </Table>
        </div>
      </Show>
    </section>
  )
}
