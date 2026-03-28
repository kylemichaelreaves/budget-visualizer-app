import type { JSX } from 'solid-js'
import { createEffect, onCleanup } from 'solid-js'
import type { DailyInterval, SummaryTypeBase } from '@types'
import { createLineChart } from './createLineChart'

export default function LineChart(props: {
  summaries: (SummaryTypeBase | DailyInterval)[]
  handleOnClickSelection: (intervalDate: string) => void
  dataTestId?: string
  loading?: boolean
}): JSX.Element {
  let svgEl: SVGSVGElement | undefined
  let wrapperEl: HTMLDivElement | undefined
  let rafId: number | undefined

  createEffect(() => {
    const el = svgEl
    const summaries = props.summaries
    const loading = props.loading
    const onClickSelection = props.handleOnClickSelection
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = undefined
    }
    if (!el || loading || !summaries?.length) {
      if (el) el.innerHTML = ''
      wrapperEl?.querySelectorAll('[data-slot="chart-tooltip"]').forEach((tooltipEl) => tooltipEl.remove())
      return
    }
    rafId = requestAnimationFrame(() => {
      rafId = undefined
      if (svgEl && svgEl.parentElement && svgEl.parentElement.getBoundingClientRect().width > 0) {
        createLineChart(svgEl, summaries, onClickSelection)
      }
    })
  })

  onCleanup(() => {
    if (rafId != null) cancelAnimationFrame(rafId)
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
