import { createMemo, For, type JSX, Show } from 'solid-js'
import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { updateRecurringSeries } from '@api/recurring/updateRecurringSeries'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { queryKeys } from '@api/queryKeys'
import {
  CheckCircleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  WarningIcon,
  WarningTriangleIcon,
} from '@shared/icons'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import { Card, CardContent } from '@components/ui/card'
import { formatUsdAbs } from '@utils/formatUsd'
import type { RecurringSeries } from '@types'
import {
  formatSeriesDate,
  hasCadenceConflict,
  monthlyAmount,
  triageState,
  type TriageState,
} from './createRecurringDerivedData'
import RecurringAvatar from './RecurringAvatar'

type LaneState = Exclude<TriageState, null>

interface StateStyle {
  label: string
  /** Names the icon in `data-icon`, so state is distinguishable in markup as well as on screen. */
  icon: string
  /** Left stripe colour. `price-down` and `stopped` share one on purpose: both are good news. */
  stripe: string
  /** Tinted badge: the state's muted token behind its on-muted text token. */
  badge: string
  glyph: () => JSX.Element
}

// Complete class strings, never assembled, so Tailwind can see them.
const STATE_STYLES: Record<LaneState, StateStyle> = {
  'price-up': {
    label: 'Price up',
    icon: 'trending-up',
    stripe: 'border-l-negative',
    badge: 'bg-negative-muted text-negative-emphasis',
    glyph: () => <TrendingUpIcon class="size-3" />,
  },
  'price-down': {
    label: 'Price down',
    icon: 'trending-down',
    stripe: 'border-l-positive',
    badge: 'bg-positive-muted text-positive-emphasis',
    glyph: () => <TrendingDownIcon class="size-3" />,
  },
  late: {
    label: 'Late',
    icon: 'warning-triangle',
    stripe: 'border-l-caution',
    badge: 'bg-caution-muted text-caution-on-muted',
    glyph: () => <WarningTriangleIcon class="size-3" />,
  },
  conflict: {
    label: 'Conflict',
    icon: 'warning',
    stripe: 'border-l-accent-purple',
    badge: 'bg-accent-purple-muted text-accent-purple-foreground',
    glyph: () => <WarningIcon class="size-3" />,
  },
  stopped: {
    label: 'Stopped',
    icon: 'check-circle',
    stripe: 'border-l-positive',
    badge: 'bg-positive-muted text-positive-emphasis',
    glyph: () => <CheckCircleIcon class="size-3" />,
  },
}

/**
 * `late` is the server's stored status and `stopped` is the live-decayed remainder of one, so
 * both describe the last scan, not today. The caption keeps a stale snapshot from being read as
 * current truth.
 */
const AS_OF_SCAN_STATES: ReadonlySet<LaneState> = new Set<LaneState>(['late', 'stopped'])

/** The last two charges by date, oldest first. ISO calendar dates sort lexicographically. */
function lastPriceStep(s: RecurringSeries): { from: number; to: number } | null {
  const ordered = [...(s.amountHistory ?? [])].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  )
  if (ordered.length < 2) return null
  return { from: ordered[ordered.length - 2].amount, to: ordered[ordered.length - 1].amount }
}

function reasonFor(s: RecurringSeries, state: LaneState): string {
  switch (state) {
    case 'price-up':
    case 'price-down': {
      const step = lastPriceStep(s)
      const verb = state === 'price-up' ? 'rose' : 'fell'
      return step
        ? `Charge ${verb} from ${formatUsdAbs(step.from)} to ${formatUsdAbs(step.to)}`
        : `Charge ${verb} on the last payment`
    }
    case 'late':
      // A calendar date, so `formatSeriesDate` is right here (it must never see an ISO instant).
      return s.nextExpectedDate
        ? `Payment was due ${formatSeriesDate(s.nextExpectedDate)} and has not arrived`
        : 'Payment is overdue'
    case 'stopped':
      return `No payment since ${formatSeriesDate(s.lastDate)}`
    case 'conflict':
      if (hasCadenceConflict(s)) return `Detected as ${s.cadence}, but the memo says ${s.memoFrequency}`
      return 'Detected as recurring, but the memo is marked not recurring'
  }
}

function TriageCard(props: { series: RecurringSeries; state: LaneState }) {
  const queryClient = useQueryClient()
  const style = () => STATE_STYLES[props.state]

  // Dismiss writes only the user's decision about the detection, never a detected fact.
  const dismiss = useMutation(() => ({
    mutationFn: () => updateRecurringSeries(props.series.id, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all }),
  }))

  // Accepting a conflict corrects the user's own label, so it writes the memo through the
  // existing memo mutation, which invalidates the memo keys and `recurring.all`.
  const memo = mutateMemo()

  const memoName = () => props.series.memoName?.trim() ?? ''
  const cadenceConflict = () => hasCadenceConflict(props.series)
  const busy = () => dismiss.isPending || memo.isPending
  const error = () => (dismiss.isError ? dismiss.error : memo.isError ? memo.error : null)

  const acceptLabel = () => (cadenceConflict() ? `Set ${props.series.cadence}` : 'Mark recurring')
  const keepLabel = () => (cadenceConflict() ? `Keep ${props.series.memoFrequency}` : 'Keep not recurring')

  const accept = () => {
    // `updateMemo` refuses a nameless memo; the button is disabled, this keeps the guard honest.
    if (!memoName()) return
    dismiss.reset()
    memo.mutate({
      id: props.series.memoId,
      name: props.series.memoName as string,
      recurring: true,
      frequency: props.series.cadence,
    })
  }
  const dismissSeries = () => {
    memo.reset()
    dismiss.mutate()
  }

  return (
    <Card
      class={`border-l-4 ${style().stripe}`}
      data-testid={`recurring-triage-card-${props.series.id}`}
      data-state={props.state}
    >
      <CardContent class="flex flex-col gap-3 py-4">
        <div class="flex flex-wrap items-center gap-3">
          <RecurringAvatar memoName={props.series.memoName} avatarS3Url={props.series.avatarS3Url} />
          <span class="text-foreground min-w-0 flex-1 truncate font-medium">
            {memoName() || 'Unnamed memo'}
          </span>
          <Badge
            variant="outline"
            class={`border-transparent ${style().badge}`}
            data-testid="recurring-triage-badge"
          >
            <span data-testid="recurring-triage-icon" data-icon={style().icon} class="inline-flex">
              {style().glyph()}
            </span>
            {style().label}
          </Badge>
          <span class="text-foreground font-semibold tabular-nums" data-testid="recurring-triage-monthly">
            {formatUsdAbs(monthlyAmount(props.series))}/mo
          </span>
        </div>

        <p class="text-muted-foreground m-0 text-sm" data-testid="recurring-triage-reason">
          {reasonFor(props.series, props.state)}
        </p>
        <Show when={AS_OF_SCAN_STATES.has(props.state)}>
          <p
            class="text-muted-foreground m-0 text-xs"
            data-testid="recurring-triage-as-of-scan"
            title="Status from the last scan. Rescan to refresh it."
          >
            As of last scan
          </p>
        </Show>

        <Show when={props.state === 'conflict'}>
          <Show when={!memoName()}>
            <p class="text-muted-foreground m-0 text-xs" data-testid="recurring-triage-needs-name">
              This memo has no name, so it cannot be updated here. Name it on the memo page first.
            </p>
          </Show>
        </Show>

        <Show when={error()}>
          {(err) => (
            <p class="text-negative m-0 text-sm" role="alert">
              {extractApiErrorMessage(err())}
            </p>
          )}
        </Show>

        <div class="flex flex-wrap gap-2">
          <Show
            when={props.state === 'conflict'}
            fallback={
              <Button type="button" size="sm" variant="outline" disabled={busy()} onClick={dismissSeries}>
                Dismiss
              </Button>
            }
          >
            <Button type="button" size="sm" disabled={busy() || !memoName()} onClick={accept}>
              {acceptLabel()}
            </Button>
            {/* Keeping the memo as it is leaves nothing to write, so it sets the detection aside. */}
            <Button type="button" size="sm" variant="outline" disabled={busy()} onClick={dismissSeries}>
              {keepLabel()}
            </Button>
          </Show>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Series that need a decision, one card each. State is carried by form (left stripe, tinted
 * badge, icon) as well as text so the lane scans without reading. `today` is a prop so callers
 * and tests control the clock: it governs only how long a stopped series stays in the lane.
 * Renders nothing, heading included, when there is nothing to review.
 */
export default function RecurringTriageLane(props: { series: RecurringSeries[]; today: string }) {
  const items = createMemo(() =>
    props.series.flatMap((series) => {
      const state = triageState(series, props.today)
      return state === null ? [] : [{ series, state }]
    }),
  )

  return (
    <Show when={items().length > 0}>
      <section
        class="flex flex-col gap-3"
        aria-labelledby="recurring-triage-heading"
        data-testid="recurring-triage-lane"
      >
        <h3 id="recurring-triage-heading" class="text-foreground m-0 text-lg font-semibold">
          Needs review
        </h3>
        <ul class="m-0 flex list-none flex-col gap-3 p-0">
          <For each={items()}>
            {(item) => (
              <li>
                <TriageCard series={item.series} state={item.state} />
              </li>
            )}
          </For>
        </ul>
      </section>
    </Show>
  )
}
