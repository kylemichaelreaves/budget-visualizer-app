import type { JSX } from 'solid-js'
import { createMemo } from 'solid-js'
import { ArrowDownCircleIcon, CheckCircleIcon, TrendingDownIcon, WarningTriangleIcon } from '@shared/icons'
import { Card, CardContent } from '@components/ui/card'
import { formatUsdAbs } from '@utils/formatUsd'
import type { RecurringSeries } from '@types'
import { monthlyBurn, needsReviewCount, stoppedSavings } from './createRecurringDerivedData'
import { todayIso } from './recurringPageUtils'

type Tone = 'red' | 'green' | 'amber' | 'violet'

/** Same shape as `MemoSummaryStatCard`'s tone map, plus amber (the app's `caution` token). */
const toneIconWrap: Record<Tone, string> = {
  red: 'rounded-full bg-negative-muted p-2',
  green: 'rounded-full bg-positive-muted p-2',
  amber: 'rounded-full bg-caution-muted p-2',
  violet: 'rounded-full bg-accent-purple-muted p-2',
}

/**
 * Amber uses `caution-foreground`, not `caution`: the latter is a bright yellow that fails
 * contrast as text on a light card, and the rest of the app already reads amber text this way.
 */
const toneFigure: Record<Tone, string> = {
  red: 'text-2xl font-bold text-negative m-0',
  green: 'text-2xl font-bold text-positive m-0',
  amber: 'text-2xl font-bold text-caution-foreground m-0',
  violet: 'text-2xl font-bold text-accent-purple m-0',
}

function StatCard(props: {
  testId: string
  tone: Tone
  label: string
  icon: JSX.Element
  value: string
  caption: string
}) {
  return (
    <Card data-testid={props.testId}>
      <CardContent class="pt-5 pb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class={toneIconWrap[props.tone]}>{props.icon}</div>
          <span class="text-sm font-medium text-muted-foreground">{props.label}</span>
        </div>
        <p class={toneFigure[props.tone]} data-testid={`${props.testId}-value`}>
          {props.value}
        </p>
        <p class="text-xs text-muted-foreground mt-1 m-0" data-testid={`${props.testId}-caption`}>
          {props.caption}
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * The four headline figures. Every number is as of the last server-side scan; the page header
 * says so. `today` only governs how long a stopped series stays in the needs-review window.
 */
export default function RecurringStatCards(props: { series: RecurringSeries[]; today?: string }) {
  const burn = createMemo(() => monthlyBurn(props.series))
  const review = createMemo(() => needsReviewCount(props.series, props.today ?? todayIso()))
  const savings = createMemo(() => stoppedSavings(props.series))
  // Counts describe reality, so dismissal (which only silences the triage lane) is not consulted.
  const activeCount = createMemo(() => props.series.filter((s) => s.status === 'active').length)
  // Same population as `stoppedSavings`, so the count and the saving always describe the same rows.
  const stoppedCount = createMemo(() => props.series.filter((s) => s.status === 'stopped').length)

  return (
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="recurring-stat-cards">
      <StatCard
        testId="recurring-stat-burn"
        tone="red"
        label="Monthly burn"
        icon={<ArrowDownCircleIcon class="size-5 text-negative" />}
        value={formatUsdAbs(burn())}
        caption="Active + overdue, normalized across cadences"
      />
      <StatCard
        testId="recurring-stat-active"
        tone="green"
        label="Active"
        icon={<CheckCircleIcon class="size-5 text-positive" />}
        value={String(activeCount())}
        caption="Paying on schedule"
      />
      <StatCard
        testId="recurring-stat-review"
        tone="amber"
        label="Needs review"
        icon={<WarningTriangleIcon class="size-5 text-caution-foreground" />}
        value={String(review())}
        caption="Price changes, late or conflicting"
      />
      <StatCard
        testId="recurring-stat-stopped"
        tone="violet"
        label="Stopped"
        icon={<TrendingDownIcon class="size-5 text-accent-purple" />}
        value={String(stoppedCount())}
        caption={`${formatUsdAbs(savings())}/mo no longer charged`}
      />
    </div>
  )
}
