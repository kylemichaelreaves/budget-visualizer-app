import { createEffect, onCleanup } from 'solid-js'
import type { DailyInterval, SummaryTypeBase } from '@types'
import { useElementSize } from '@composables/useElementSize'
import { createLineChart } from './createLineChart'
import type { JSX } from '@solidjs/web'

function removeTooltips(wrapper: HTMLElement | undefined): void {
  wrapper?.querySelectorAll('[data-slot="chart-tooltip"]').forEach((el) => el.remove())
}

export default function LineChart(props: {
  summaries: (SummaryTypeBase | DailyInterval)[]
  handleOnClickSelection: (intervalDate: string) => void
  dataTestId?: string
  stackedDateLabels?: boolean
}): JSX.Element {
  let svgEl: SVGSVGElement | undefined
  let wrapperEl: HTMLDivElement | undefined

  /**
   * Width is tracked reactively, so a wrapper that measures 0 at first (skeleton
   * swap, tab activation, column resize) draws once it has a size instead of
   * silently never drawing.
   */
  const [size, attachSizeRef] = useElementSize()

  createEffect(
    () => ({
      summaries: props.summaries,
      onClickSelection: props.handleOnClickSelection,
      stackedDateLabels: props.stackedDateLabels,
      width: size().w,
    }),
    ({ summaries, onClickSelection, stackedDateLabels, width }) => {
      const el = svgEl
      if (!el || !summaries?.length || width <= 0) {
        if (el && !summaries?.length) {
          el.innerHTML = ''
          removeTooltips(wrapperEl)
        }
        return
      }
      createLineChart(el, summaries, onClickSelection, { stackedDateLabels })
    },
  )

  onCleanup(() => removeTooltips(wrapperEl))

  return (
    <div
      ref={(el) => {
        wrapperEl = el
        attachSizeRef(el)
      }}
      class="relative w-full text-foreground"
    >
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
