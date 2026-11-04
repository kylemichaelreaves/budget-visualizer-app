import { createMemo, For } from 'solid-js'
import * as d3 from 'd3'
import { formatMs } from '@components/observability/helpers/formatMetric'
import type { MetricPoint } from '@types'

const WIDTH = 600
const HEIGHT = 64
const GAP = 2
/** Bars above this p95 take the negative token. Matches the API degraded threshold. */
export const SLOW_THRESHOLD_MS = 800

interface Bar {
  x: number
  y: number
  width: number
  height: number
  over: boolean
}

function describe(points: MetricPoint[]): string {
  const values = points.flatMap((p) => (p.value === null ? [] : [p.value]))
  if (values.length === 0) return 'No latency data'
  return `p95 latency per bucket, peak ${formatMs(Math.max(...values))}`
}

/** One bar per p95 bucket. A null bucket is a gap, never a zero-height bar. */
export default function LatencyBars(props: { points: MetricPoint[] }) {
  const bars = createMemo<Bar[]>(() => {
    const points = props.points ?? []
    const max = d3.max(points, (p) => p.value ?? 0) ?? 0
    const y = d3
      .scaleLinear()
      .domain([0, Math.max(max, SLOW_THRESHOLD_MS)])
      .range([HEIGHT, 0])
    const slot = WIDTH / Math.max(points.length, 1)
    return points.flatMap((p, i) =>
      p.value === null
        ? []
        : [
            {
              x: i * slot + GAP / 2,
              y: y(p.value),
              width: Math.max(slot - GAP, 1),
              height: HEIGHT - y(p.value),
              over: p.value > SLOW_THRESHOLD_MS,
            },
          ],
    )
  })

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      class="h-16 w-full"
      role="img"
      aria-label={describe(props.points ?? [])}
      data-testid="observability-latency-bars"
    >
      <For each={bars()}>
        {(bar) => (
          <rect
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={bar.height}
            rx="1"
            class={bar.over ? 'fill-negative' : 'fill-brand'}
            data-testid="observability-latency-bar"
            data-over={bar.over ? 'true' : 'false'}
          />
        )}
      </For>
    </svg>
  )
}
