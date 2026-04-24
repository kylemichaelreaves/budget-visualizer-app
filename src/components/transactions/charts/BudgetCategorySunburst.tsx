import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import type { BudgetCategorySummary } from '@types'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import { Skeleton } from '@components/ui/skeleton'
import { formatUsd } from '@utils/formatUsd'
import { ChevronRightIcon } from '@shared/icons/ChevronRightIcon'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import type { Timeframe } from '@types'
import {
  mountBudgetCategorySunburstChart,
  type BudgetCategorySunburstNavigation,
} from './mountBudgetCategorySunburst'

export default function BudgetCategorySunburst(props: {
  data: BudgetCategorySummary[]
  isLoading?: boolean
  dataTestId?: string
  onSliceClick?: (row: BudgetCategorySummary) => void
  showLegend?: boolean
  timeFrame?: Timeframe
  date?: string
}): JSX.Element {
  let svgRef: SVGSVGElement | undefined
  let tooltipRef: HTMLDivElement | undefined

  const [breadcrumb, setBreadcrumb] = createSignal<Array<{ name: string; node: unknown }>>([])
  const [centerName, setCenterName] = createSignal('Total')
  const [centerValue, setCenterValue] = createSignal(0)

  let navigation: BudgetCategorySunburstNavigation | undefined

  const colorHelpers = createMemo(() => budgetCategoryColorsFromData(props.data))

  createEffect(() => {
    const data = props.data
    const svg = svgRef
    if (!svg || props.isLoading || !data?.length) {
      if (svg) svg.innerHTML = ''
      navigation = undefined
      return
    }

    const parents = data.filter((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)
    if (!parents.length) {
      svg.innerHTML = ''
      navigation = undefined
      return
    }

    mountBudgetCategorySunburstChart({
      svg,
      data,
      colorHelpers: colorHelpers(),
      tooltipEl: tooltipRef,
      setCenterName,
      setCenterValue,
      setBreadcrumb,
      onSliceClick: props.onSliceClick,
      setNavigation: (api) => {
        navigation = api
      },
    })
  })

  const id = () => props.dataTestId ?? 'budget-category-sunburst'

  return (
    <div data-testid={id()} class="relative">
      <Show when={props.isLoading}>
        <div class="flex flex-col items-center justify-center gap-3 py-4">
          <Skeleton class="size-[200px] rounded-full" />
        </div>
      </Show>

      <Show when={breadcrumb().length > 0}>
        <div
          class="flex items-center gap-1 text-xs text-muted-foreground min-h-[20px] px-1 mb-1 flex-wrap"
          data-testid={`${id()}-breadcrumb`}
        >
          <button
            class="hover:text-foreground transition-colors cursor-pointer"
            onClick={() => navigation && navigation.zoomTo(navigation.rootNode)}
          >
            All
          </button>
          <For each={breadcrumb()}>
            {(crumb, index) => (
              <>
                <ChevronRightIcon class="size-3 shrink-0" />
                <Show
                  when={index() === breadcrumb().length - 1}
                  fallback={
                    <button
                      class="hover:text-foreground transition-colors cursor-pointer"
                      onClick={() => navigation?.zoomTo(crumb.node)}
                    >
                      {crumb.name}
                    </button>
                  }
                >
                  <span class="text-foreground font-medium">{crumb.name}</span>
                </Show>
              </>
            )}
          </For>
        </div>
      </Show>

      <div class="relative w-full max-w-[280px] mx-auto">
        <svg ref={(el) => (svgRef = el)} class="text-foreground w-full block" data-testid={`${id()}-chart`} />

        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="flex flex-col items-center text-center" style={{ width: '33%' }}>
            <div class="font-semibold text-foreground leading-tight w-full truncate text-[10px]">
              {centerName()}
            </div>
            <div class="text-muted-foreground font-medium mt-0.5 text-[9px]">{formatUsd(centerValue())}</div>
            <Show when={props.timeFrame && props.date}>
              <div class="text-muted-foreground mt-0.5 text-[8px] opacity-70">
                {getPeriodLabel(props.timeFrame!, props.date!)}
              </div>
            </Show>
          </div>
        </div>
      </div>

      <div
        ref={(el) => (tooltipRef = el)}
        class="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity"
      />
    </div>
  )
}
