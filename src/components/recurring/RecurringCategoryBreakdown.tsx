import { createMemo, For, Show } from 'solid-js'
import { formatUsdAbs } from '@utils/formatUsd'
import type { RecurringSeries } from '@types'
import { burnByCategory, monthlyBurn } from './createRecurringDerivedData'

/**
 * Where the monthly burn goes, as a stacked bar and an itemised list.
 *
 * This section is an *explanation* of the headline "Monthly burn" figure, so it must never
 * disagree with it. Both numbers come from `createRecurringDerivedData` (`monthlyBurn` and
 * `burnByCategory`), which sum the same cent-exact per-series figures, so the amounts add up to
 * the headline exactly. This component's own job is to not break that in presentation: amounts
 * are shown as sent, and the percentages are apportioned (below) so the displayed shares total
 * exactly 100 rather than 99.9 or 100.1.
 *
 * Dismissed series are included because the derived data includes them: dismissal silences the
 * triage lane, not the ledger.
 */

const DISPLAY_UNITS = 10 // percentages are shown to one decimal place: units of 0.1%
const TOTAL_UNITS = 100 * DISPLAY_UNITS

/**
 * The narrowest a segment is drawn, in units of 0.1%. A category worth 0.1% of the burn would
 * otherwise be a sub-pixel sliver and read as missing from the bar.
 */
const MIN_SEGMENT_UNITS = 1 * DISPLAY_UNITS

interface SwatchStyle {
  /** Fill for the bar segment (the `<rect>` paints with `currentColor`). */
  fill: string
  /** The same token as a background, for the list swatch. */
  swatch: string
}

// Complete class strings, never assembled, so Tailwind can see them. Ordered so that tokens
// which look alike (chart-4 / chart-5, info / brand) are never neighbours. The semantic
// positive / negative / caution tokens are left out on purpose: a category is not good or bad news.
const PALETTE: SwatchStyle[] = [
  { fill: 'text-chart-1', swatch: 'bg-chart-1' },
  { fill: 'text-chart-2', swatch: 'bg-chart-2' },
  { fill: 'text-chart-3', swatch: 'bg-chart-3' },
  { fill: 'text-accent-purple', swatch: 'bg-accent-purple' },
  { fill: 'text-chart-4', swatch: 'bg-chart-4' },
  { fill: 'text-info', swatch: 'bg-info' },
  { fill: 'text-chart-5', swatch: 'bg-chart-5' },
  { fill: 'text-brand', swatch: 'bg-brand' },
]
// "Uncategorized" is the absence of a category, so it takes a neutral rather than a palette slot.
const NEUTRAL: SwatchStyle = { fill: 'text-muted-foreground', swatch: 'bg-muted-foreground' }
const UNCATEGORIZED = 'Uncategorized'

const BAR_HEIGHT = 12

/**
 * Rounds percentage shares to units of 0.1% so that they total exactly 100% (1000 units), by
 * the largest-remainder method: floor every share, then hand the leftover units to the shares
 * with the biggest fractional parts. Naive per-row rounding can total 99.9 or 100.1, and a
 * breakdown that does not add up to 100 contradicts the headline it explains. All zeros in
 * (nothing to apportion) gives all zeros out.
 */
export function apportionTenths(shares: number[]): number[] {
  const scaled = shares.map((share) => share * DISPLAY_UNITS)
  if (scaled.every((s) => !(s > 0))) return scaled.map(() => 0)

  const floors = scaled.map((s) => Math.floor(s))
  let leftover = TOTAL_UNITS - floors.reduce((a, b) => a + b, 0)
  const byRemainder = scaled
    .map((s, index) => ({ index, remainder: s - Math.floor(s) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index)

  const units = [...floors]
  for (let i = 0; leftover > 0 && byRemainder.length > 0; i = (i + 1) % byRemainder.length, leftover--) {
    units[byRemainder[i].index] += 1
  }
  return units
}

/**
 * Bar segment widths in units of 0.1%, always totalling exactly 1000. They equal the displayed
 * shares except that a segment under `MIN_SEGMENT_UNITS` is widened to it, the difference being
 * taken from the largest segment (which can best afford it), so a tiny category stays visible
 * without the bar overflowing or leaving a gap.
 */
export function segmentWidths(units: number[]): number[] {
  const widths = [...units]
  for (let i = 0; i < widths.length; i++) {
    if (widths[i] >= MIN_SEGMENT_UNITS) continue
    const largest = widths.reduce((best, w, j) => (w > widths[best] ? j : best), 0)
    const take = Math.min(MIN_SEGMENT_UNITS - widths[i], Math.max(0, widths[largest] - MIN_SEGMENT_UNITS))
    widths[i] += take
    widths[largest] -= take
  }
  return widths
}

const formatPercent = (units: number) => `${(units / DISPLAY_UNITS).toFixed(1)}%`
const formatOffset = (units: number) => `${Number((units / DISPLAY_UNITS).toFixed(1))}%`

interface BreakdownRow {
  category: string
  amount: number
  /** Displayed share, in units of 0.1%. */
  units: number
  /** Drawn width, in units of 0.1%. */
  width: number
  /** Drawn left edge, in units of 0.1%. */
  offset: number
  style: SwatchStyle
}

/**
 * A collapsible section (open by default) below the series table. Its summary names the burn
 * total, so it still reads when collapsed. The stacked bar is an SVG with no `viewBox`: it is
 * `BAR_HEIGHT` px tall exactly, and segments are positioned in percentages of the available
 * width, so there is no aspect ratio to squash it. Colour is never the only carrier: the list
 * labels every segment and the bar's `aria-label` spells out each category and its share.
 */
export default function RecurringCategoryBreakdown(props: { series: RecurringSeries[] }) {
  const burn = createMemo(() => monthlyBurn(props.series))

  const rows = createMemo<BreakdownRow[]>(() => {
    // A category worth exactly nothing has no share to show and no segment to draw. Neither
    // changes the total.
    const burns = burnByCategory(props.series).filter((row) => row.amount !== 0)
    const units = apportionTenths(burns.map((row) => row.pct))
    const widths = segmentWidths(units)
    let nextColour = 0
    let offset = 0
    return burns.map((row, i) => {
      const style = row.category === UNCATEGORIZED ? NEUTRAL : PALETTE[nextColour++ % PALETTE.length]
      const placed = {
        category: row.category,
        amount: row.amount,
        units: units[i],
        width: widths[i],
        offset,
        style,
      }
      offset += widths[i]
      return placed
    })
  })

  // Nothing to break down: no live series, or live series that all cost nothing.
  const hasBreakdown = () => burn() > 0 && rows().length > 0

  const barLabel = () =>
    `Monthly burn by category: ${rows()
      .map((row) => `${row.category} ${formatPercent(row.units)}`)
      .join(', ')}`

  return (
    <section aria-label="Monthly burn by category" data-testid="recurring-category-breakdown">
      <details open class="rounded-lg border bg-card" data-testid="recurring-breakdown-details">
        <summary class="text-foreground cursor-pointer px-4 py-3 font-semibold">
          Where the monthly burn goes:{' '}
          <span class="tabular-nums" data-testid="recurring-breakdown-total">
            {formatUsdAbs(burn())}
          </span>
          /mo
        </summary>
        <div class="flex flex-col gap-4 px-4 pt-1 pb-4">
          <Show
            when={hasBreakdown()}
            fallback={
              <p class="text-muted-foreground m-0 text-sm" data-testid="recurring-breakdown-empty">
                No live recurring payments to break down. Stopped payments are not part of the monthly burn.
              </p>
            }
          >
            <svg
              width="100%"
              height={BAR_HEIGHT}
              role="img"
              aria-label={barLabel()}
              data-testid="recurring-breakdown-bar"
              class="bg-muted block w-full overflow-hidden rounded-full"
            >
              <For each={rows()}>
                {(row) => (
                  <rect
                    x={formatOffset(row.offset)}
                    y="0"
                    width={formatOffset(row.width)}
                    height="100%"
                    fill="currentColor"
                    class={row.style.fill}
                    data-testid="recurring-breakdown-segment"
                    data-category={row.category}
                  />
                )}
              </For>
            </svg>

            <ul class="m-0 flex list-none flex-col gap-2 p-0">
              <For each={rows()}>
                {(row) => (
                  <li
                    class="flex items-center gap-3 text-sm"
                    data-testid="recurring-breakdown-row"
                    data-category={row.category}
                  >
                    <span aria-hidden="true" class={`size-3 shrink-0 rounded-sm ${row.style.swatch}`} />
                    <span
                      class="text-foreground min-w-0 flex-1 truncate"
                      title={row.category}
                      data-testid="recurring-breakdown-name"
                    >
                      {row.category}
                    </span>
                    <span class="text-foreground tabular-nums" data-testid="recurring-breakdown-amount">
                      {formatUsdAbs(row.amount)}
                    </span>
                    <span
                      class="text-muted-foreground w-14 text-right tabular-nums"
                      data-testid="recurring-breakdown-pct"
                    >
                      {formatPercent(row.units)}
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </div>
      </details>
    </section>
  )
}
