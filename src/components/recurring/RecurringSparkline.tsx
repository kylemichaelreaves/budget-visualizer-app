import { createMemo, For, Show } from 'solid-js'
import { formatUsdAbs } from '@utils/formatUsd'
import type { RecurringAmountPoint } from '@types'

const WIDTH = 80
const HEIGHT = 24
// Padding keeps the emphasised final point (and the stroke) inside the viewBox.
const PAD_X = 4
const PAD_Y = 4
const POINT_RADIUS = 1.5
const FINAL_POINT_RADIUS = 3
const DASH = '3 2'

type Direction = 'up' | 'down' | 'flat'

interface Plotted {
  x: number
  y: number
}

/**
 * Colour is by direction of the latest step: `--negative` when the price rose, `--muted-foreground`
 * otherwise. They are Tailwind classes on the `<svg>`, and every shape draws with `currentColor`,
 * so the whole mark takes one token and there is no literal colour anywhere.
 */
const DIRECTION_COLOUR: Record<Direction, string> = {
  up: 'text-negative',
  down: 'text-muted-foreground',
  flat: 'text-muted-foreground',
}

const round = (n: number) => Number(n.toFixed(2))

/** Oldest first. ISO calendar dates sort lexicographically, so the array order is not trusted. */
function byDate(history: RecurringAmountPoint[]): RecurringAmountPoint[] {
  return [...history].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/** The last step, judged at cent resolution so float noise never reads as a price change. */
function directionOf(ordered: RecurringAmountPoint[]): Direction {
  if (ordered.length < 2) return 'flat'
  const cents = (p: RecurringAmountPoint) => Math.round(p.amount * 100)
  const step = cents(ordered[ordered.length - 1]) - cents(ordered[ordered.length - 2])
  return step > 0 ? 'up' : step < 0 ? 'down' : 'flat'
}

/** One point per entry, spread evenly in x and scaled to the observed range in y. */
function plot(ordered: RecurringAmountPoint[]): Plotted[] {
  const amounts = ordered.map((p) => p.amount)
  const min = Math.min(...amounts)
  const max = Math.max(...amounts)
  const range = max - min
  return ordered.map((p, i) => ({
    x: round(ordered.length === 1 ? WIDTH / 2 : PAD_X + (i * (WIDTH - 2 * PAD_X)) / (ordered.length - 1)),
    // A flat history (and a single entry) has no range to scale: centre it. SVG y grows downward.
    y: round(range > 0 ? PAD_Y + ((max - p.amount) / range) * (HEIGHT - 2 * PAD_Y) : HEIGHT / 2),
  }))
}

const toPoints = (list: Plotted[]) => list.map((p) => `${p.x},${p.y}`).join(' ')

function describe(ordered: RecurringAmountPoint[]): string {
  if (ordered.length === 0) return 'No amount history'
  const first = formatUsdAbs(ordered[0].amount)
  const last = formatUsdAbs(ordered[ordered.length - 1].amount)
  return ordered.length === 1 ? `Amount history: ${last}` : `Amount history from ${first} to ${last}`
}

/**
 * A small inline-SVG price history: a line through one point per `amountHistory` entry with the
 * final point emphasised. A flat history draws a flat line and a single entry draws one dot.
 * When `stopped`, the trailing segment (the last two charges) is dashed.
 */
export default function RecurringSparkline(props: { history: RecurringAmountPoint[]; stopped?: boolean }) {
  const ordered = createMemo(() => byDate(props.history ?? []))
  const plotted = createMemo(() => plot(ordered()))
  const direction = createMemo(() => directionOf(ordered()))

  // A stopped series keeps a solid run for everything before its last two charges, and a dashed
  // segment for the final step. Otherwise one solid line spans the lot.
  const dashedTail = createMemo<[Plotted, Plotted] | null>(() => {
    const all = plotted()
    return props.stopped && all.length >= 2 ? [all[all.length - 2], all[all.length - 1]] : null
  })
  const solidRun = createMemo(() => {
    const all = plotted()
    const run = dashedTail() ? all.slice(0, -1) : all
    return run.length >= 2 ? run : null
  })

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width={WIDTH}
      height={HEIGHT}
      role="img"
      aria-label={describe(ordered())}
      data-testid="recurring-sparkline"
      data-direction={direction()}
      class={`${DIRECTION_COLOUR[direction()]} shrink-0`}
    >
      <Show when={solidRun()}>
        {(run) => (
          <polyline
            points={toPoints(run())}
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        )}
      </Show>
      <Show when={dashedTail()}>
        {(tail) => (
          <line
            x1={tail()[0].x}
            y1={tail()[0].y}
            x2={tail()[1].x}
            y2={tail()[1].y}
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-dasharray={DASH}
          />
        )}
      </Show>
      <For each={plotted()}>
        {(point, i) => {
          const isFinal = () => i() === plotted().length - 1
          return (
            <circle
              cx={point.x}
              cy={point.y}
              r={isFinal() ? FINAL_POINT_RADIUS : POINT_RADIUS}
              fill="currentColor"
              data-final={isFinal() ? 'true' : undefined}
            />
          )
        }}
      </For>
    </svg>
  )
}
