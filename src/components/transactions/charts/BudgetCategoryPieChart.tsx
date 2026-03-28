import type { JSX } from 'solid-js'
import { createEffect, createMemo, For, Show } from 'solid-js'
import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import { buildBudgetCategoryColorMap } from '@composables/budgetCategoryColors'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function BudgetCategoryPieChart(props: {
  data: BudgetCategorySummary[]
  isLoading?: boolean
  dataTestId?: string
  onSliceClick?: (row: BudgetCategorySummary) => void
  showLegend?: boolean
}): JSX.Element {
  let svgRef: SVGSVGElement | undefined
  let tooltipRef: HTMLDivElement | undefined

  createEffect(() => {
    const data = props.data
    const svg = svgRef
    if (!svg || props.isLoading || !data?.length) {
      if (svg) svg.innerHTML = ''
      return
    }

    const parents = data.filter((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)
    if (!parents.length) {
      svg.innerHTML = ''
      return
    }

    const colorMap = buildBudgetCategoryColorMap(data)
    const container = svg.parentElement
    const containerWidth = container ? container.getBoundingClientRect().width : 300
    if (containerWidth <= 0) return
    const w = Math.min(containerWidth, 280)
    const h = Math.min(w * 0.85, 240)
    const radius = Math.min(w, h) / 2 - 16
    const innerRadius = radius * 0.55

    d3.select(svg).selectAll('*').remove()

    const g = d3
      .select(svg)
      .attr('width', w)
      .attr('height', h)
      .attr('viewBox', `0 0 ${w} ${h}`)
      .style('width', '100%')
      .style('height', 'auto')
      .append('g')
      .attr('transform', `translate(${w / 2},${h / 2})`)

    const pie = d3
      .pie<BudgetCategorySummary>()
      .value((d) => Math.abs(d.total_amount_debit))
      .sort(null)
      .padAngle(0.02)

    const arc = d3
      .arc<d3.PieArcDatum<BudgetCategorySummary>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4)

    const arcHover = d3
      .arc<d3.PieArcDatum<BudgetCategorySummary>>()
      .innerRadius(innerRadius)
      .outerRadius(radius + 6)
      .cornerRadius(4)

    const onSliceClick = props.onSliceClick
    const tooltip = tooltipRef

    const arcG = g.selectAll('.arc').data(pie(parents)).enter().append('g').attr('class', 'arc')

    arcG
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => colorMap.get(String(d.data.category_id)) || '#6b7280')
      .style('cursor', onSliceClick ? 'pointer' : 'default')
      .style('transition', 'opacity 0.15s')
      .on('mouseenter', function (_event, d) {
        d3.select(this).transition().duration(150).attr('d', arcHover(d)!)
        if (tooltip) {
          tooltip.textContent = ''
          const strong = document.createElement('strong')
          strong.textContent = d.data.category_name
          tooltip.appendChild(strong)
          tooltip.appendChild(document.createElement('br'))
          tooltip.appendChild(document.createTextNode(formatCurrency(Math.abs(d.data.total_amount_debit))))
          tooltip.style.opacity = '1'
        }
      })
      .on('mousemove', function (event) {
        if (tooltip && svg) {
          const parentRect = svg.parentElement!.getBoundingClientRect()
          tooltip.style.left = `${event.clientX - parentRect.left + 12}px`
          tooltip.style.top = `${event.clientY - parentRect.top - 12}px`
        }
      })
      .on('mouseleave', function (_event, d) {
        d3.select(this).transition().duration(150).attr('d', arc(d)!)
        if (tooltip) tooltip.style.opacity = '0'
      })
      .on('click', (_event, d) => {
        onSliceClick?.(d.data)
      })

    // Center total
    const total = parents.reduce((s, c) => s + Math.abs(c.total_amount_debit), 0)
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('fill', getComputedStyle(svg).getPropertyValue('color') || '#fafafa')
      .style('font-size', '12px')
      .text('Total')
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('fill', getComputedStyle(svg).getPropertyValue('color') || '#fafafa')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .text(formatCurrency(total))
  })

  const legendColorMap = createMemo(() => buildBudgetCategoryColorMap(props.data))

  const legendParents = () =>
    props.data.filter((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)

  return (
    <div data-testid={props.dataTestId} class="relative">
      {props.isLoading ? (
        <div class="flex h-[280px] items-center justify-center text-muted-foreground">Loading chart…</div>
      ) : null}
      <svg ref={(el) => (svgRef = el)} class="text-foreground" data-testid={`${props.dataTestId}-chart`} />
      <div
        ref={(el) => (tooltipRef = el)}
        class="pointer-events-none absolute z-50 rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg opacity-0 transition-opacity"
      />
      <Show when={props.showLegend !== false}>
        <div
          data-testid={`${props.dataTestId}-legend`}
          class="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1"
        >
          <For each={legendParents()}>
            {(item) => (
              <div
                class="flex items-center gap-1.5"
                data-testid={`${props.dataTestId}-legend-item-${item.category_id}`}
              >
                <span
                  class="size-2.5 rounded-full shrink-0"
                  style={{
                    background: legendColorMap().get(String(item.category_id)) || '#6b7280',
                  }}
                />
                <span class="text-xs text-muted-foreground">
                  {item.category_name} ({formatCurrency(Math.abs(item.total_amount_debit))})
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
