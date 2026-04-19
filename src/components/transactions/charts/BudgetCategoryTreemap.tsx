import type { Accessor, JSX } from 'solid-js'
import { createEffect, createSignal, onCleanup, Show } from 'solid-js'
import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import {
  type BudgetCategoryColorHelpers,
  chartCategoryColorsWithSummaryFallback,
  getBudgetCategoryColorForChartCell,
} from '@composables/budgetCategoryColors'
import { Skeleton } from '@components/ui/skeleton'
import { formatUsd } from '@utils/formatUsd'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import type { Timeframe } from '@types'
import {
  buildBudgetCategoryChartHierarchy,
  type BudgetCategoryChartHierarchyNode,
} from './budgetCategoryChartHierarchy'

type HierarchyNode = BudgetCategoryChartHierarchyNode

export default function BudgetCategoryTreemap(props: {
  data: BudgetCategorySummary[]
  /** Same helpers as {@link TransactionsTableListCard} category pills (path-keyed colors). */
  categoryColors: Accessor<BudgetCategoryColorHelpers>
  isLoading?: boolean
  dataTestId?: string
  onCellClick?: (row: BudgetCategorySummary) => void
  timeFrame?: Timeframe
  date?: string
}): JSX.Element {
  let wrapRef: HTMLDivElement | undefined
  let tooltipRef: HTMLDivElement | undefined
  let svgRef: SVGSVGElement | undefined

  const [dims, setDims] = createSignal({ w: 0, h: 0 })

  createEffect(() => {
    const el = wrapRef
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect
      if (!cr) return
      setDims({ w: Math.floor(cr.width), h: Math.floor(cr.height) })
    })
    ro.observe(el)
    queueMicrotask(() => {
      setDims({ w: Math.floor(el.clientWidth), h: Math.floor(el.clientHeight) })
    })
    onCleanup(() => ro.disconnect())
  })

  createEffect(() => {
    const data = props.data
    const svg = svgRef
    const { w, h } = dims()
    if (!svg || props.isLoading || !data?.length || w < 8 || h < 8) {
      if (svg && (props.isLoading || !data?.length)) d3.select(svg).selectAll('*').remove()
      return
    }

    const parents = data.filter((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)
    if (!parents.length) {
      d3.select(svg).selectAll('*').remove()
      return
    }

    const colorHelpers = chartCategoryColorsWithSummaryFallback(props.categoryColors(), data)
    const hierarchyData = buildBudgetCategoryChartHierarchy(data)
    const root = d3
      .hierarchy(hierarchyData)
      .sum((d) => (d.children ? 0 : Math.abs((d as HierarchyNode).total_amount_debit)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) as d3.HierarchyNode<HierarchyNode>

    d3
      .treemap<HierarchyNode>()
      .size([w, h])
      .paddingOuter(2)
      .paddingInner(2)
      .round(true)
      .tile(d3.treemapSquarify)(root as d3.HierarchyRectangularNode<HierarchyNode>)

    const leaves = root.leaves() as d3.HierarchyRectangularNode<HierarchyNode>[]

    d3.select(svg).selectAll('*').remove()
    d3.select(svg).attr('viewBox', `0 0 ${w} ${h}`).style('width', '100%').style('height', '100%')

    const g = d3.select(svg).append('g')

    const cell = g
      .selectAll('g')
      .data(leaves)
      .join('g')
      .attr('transform', (d) => `translate(${d.x0},${d.y0})`)

    const container = wrapRef
    const tooltip = tooltipRef

    cell
      .append('rect')
      .attr('width', (d) => Math.max(0, d.x1 - d.x0))
      .attr('height', (d) => Math.max(0, d.y1 - d.y0))
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', (d) =>
        getBudgetCategoryColorForChartCell(colorHelpers, d.data as unknown as BudgetCategorySummary),
      )
      .attr('fill-opacity', 0.85)
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.12)
      .attr('stroke-width', 1)
      .style('cursor', (d) => (d.data.category_id > 0 ? 'pointer' : 'default'))
      // eslint-disable-next-line solid/reactivity
      .on('click', (_event, d) => {
        if (d.data.category_id > 0) {
          props.onCellClick?.(d.data as unknown as BudgetCategorySummary)
        }
      })

    cell
      .append('text')
      .attr('x', 4)
      .attr('y', 14)
      .attr('fill', 'currentColor')
      .style('font-size', '11px')
      .style('pointer-events', 'none')
      .style('opacity', (d) => (d.x1 - d.x0 > 56 && d.y1 - d.y0 > 28 ? 1 : 0))
      .each(function (d) {
        const text = d3.select(this)
        const name = d.data.name
        const maxChars = Math.floor((d.x1 - d.x0 - 8) / 6.5)
        text.text(
          maxChars > 3 && name.length > maxChars ? `${name.slice(0, Math.max(3, maxChars - 1))}…` : name,
        )
      })

    cell
      .append('text')
      .attr('x', 4)
      .attr('y', 28)
      .attr('fill', 'currentColor')
      .style('font-size', '10px')
      .style('opacity', (d) => (d.x1 - d.x0 > 72 && d.y1 - d.y0 > 44 ? 0.75 : 0))
      .style('pointer-events', 'none')
      .text((d) => formatUsd(Math.abs(d.value ?? 0)))

    cell
      .selectAll('rect')
      .on('mouseenter', function (event: MouseEvent, d: unknown) {
        const leaf = d as d3.HierarchyRectangularNode<HierarchyNode>
        d3.select(this).attr('fill-opacity', 1)
        if (tooltip && container) {
          tooltip.textContent = ''
          const strong = document.createElement('strong')
          strong.textContent = leaf.data.category_name
          tooltip.appendChild(strong)
          tooltip.appendChild(document.createElement('br'))
          tooltip.appendChild(
            document.createTextNode(formatUsd(Math.abs(leaf.value ?? leaf.data.total_amount_debit))),
          )
          const parentRect = container.getBoundingClientRect()
          tooltip.style.left = `${event.clientX - parentRect.left + 12}px`
          tooltip.style.top = `${event.clientY - parentRect.top - 12}px`
          tooltip.style.opacity = '1'
        }
      })
      .on('mousemove', function (event: MouseEvent) {
        if (tooltip && container) {
          const parentRect = container.getBoundingClientRect()
          tooltip.style.left = `${event.clientX - parentRect.left + 12}px`
          tooltip.style.top = `${event.clientY - parentRect.top - 12}px`
        }
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill-opacity', 0.85)
        if (tooltip) tooltip.style.opacity = '0'
      })
  })

  const id = () => props.dataTestId ?? 'budget-category-treemap'

  return (
    <div data-testid={id()} class="relative flex h-full min-h-0 w-full flex-col">
      <Show when={props.isLoading}>
        <div class="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/60">
          <Skeleton class="h-[85%] w-[95%] rounded-lg" />
        </div>
      </Show>

      <div ref={(el) => (wrapRef = el)} class="relative min-h-0 flex-1 overflow-hidden rounded-lg">
        <svg ref={(el) => (svgRef = el)} class="text-foreground block" data-testid={`${id()}-chart`} />
      </div>
      <Show when={props.timeFrame && props.date}>
        <div class="pointer-events-none mt-1 text-right text-[10px] text-muted-foreground opacity-80">
          {getPeriodLabel(props.timeFrame!, props.date!)}
        </div>
      </Show>

      <div
        ref={(el) => (tooltipRef = el)}
        class="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity"
      />
    </div>
  )
}
