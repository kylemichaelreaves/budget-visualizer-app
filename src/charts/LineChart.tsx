import type { JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup } from 'solid-js'
import type { DailyInterval, SummaryTypeBase } from '@types'
import { createLineChart } from './createLineChart'

export default function LineChart(props: {
  summaries: (SummaryTypeBase | DailyInterval)[]
  handleOnClickSelection: (intervalDate: string) => void
  dataTestId?: string
  loading?: boolean
  stackedDateLabels?: boolean
}): JSX.Element {
  let svgEl: SVGSVGElement | undefined
  let wrapperEl: HTMLDivElement | undefined

  /**
   * Track parent width reactively. Previously a one-shot rAF check would silently drop the chart
   * whenever the wrapper measured 0 (e.g. when the skeleton swap, a tab activation, or a column
   * resize hadn't settled yet) and never retry.
   */
  const [parentWidth, setParentWidth] = createSignal(0)

  createEffect(() => {
    const wrap = wrapperEl
    if (!wrap) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (cr) setParentWidth(Math.floor(cr.width))
    })
    ro.observe(wrap)
    queueMicrotask(() => setParentWidth(Math.floor(wrap.getBoundingClientRect().width)))
    onCleanup(() => ro.disconnect())
  })

  createEffect(() => {
    const el = svgEl
    const summaries = props.summaries
    const loading = props.loading
    const onClickSelection = props.handleOnClickSelection
    const width = parentWidth()
    if (!el || loading || !summaries?.length || width <= 0) {
      if (el && (!summaries?.length || loading)) el.innerHTML = ''
      if (!summaries?.length || loading) {
        wrapperEl?.querySelectorAll('[data-slot="chart-tooltip"]').forEach((tooltipEl) => tooltipEl.remove())
      }
      return
    }
    createLineChart(el, summaries, onClickSelection, {
      stackedDateLabels: props.stackedDateLabels,
    })
  })

  onCleanup(() => {
    if (wrapperEl) {
      wrapperEl.querySelectorAll('[data-slot="chart-tooltip"]').forEach((el) => el.remove())
    }
  })

  return (
    <div ref={(el) => (wrapperEl = el)} class="relative w-full text-foreground">
      <svg
        ref={(el) => {
          svgEl = el
        }}
        data-testid={`${props.dataTestId ?? 'line-chart'}-svg`}
        class="block w-full"
      />
    </div>
  )
}
