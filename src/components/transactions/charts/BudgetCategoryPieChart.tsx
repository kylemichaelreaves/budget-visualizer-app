import type { JSX } from 'solid-js'
import { createEffect, For } from 'solid-js'
import * as d3 from 'd3'
import type { BudgetCategorySummary } from '@types'
import { buildBudgetCategoryColorMap } from '@composables/budgetCategoryColors'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function BudgetCategoryPieChart(props: {
  data: BudgetCategorySummary[]
  isLoading?: boolean
  title?: string
  dataTestId?: string
  onSliceClick?: (row: BudgetCategorySummary) => void
}): JSX.Element {
  let svgRef: SVGSVGElement | undefined

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
    const w = 480
    const h = 400
    const margin = 10
    const radius = Math.min(w - margin * 2, h - margin * 2) / 2 - 20

    d3.select(svg).selectAll('*').remove()

    const g = d3
      .select(svg)
      .attr('width', w)
      .attr('height', h)
      .append('g')
      .attr('transform', `translate(${w / 2},${h / 2 - 20})`)

    const pie = d3
      .pie<BudgetCategorySummary>()
      .value((d) => Math.abs(d.total_amount_debit))
      .sort(null)

    const arc = d3.arc<d3.PieArcDatum<BudgetCategorySummary>>().innerRadius(0).outerRadius(radius)

    const arcG = g.selectAll('.arc').data(pie(parents)).enter().append('g').attr('class', 'arc')

    arcG
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => colorMap.get(String(d.data.category_id)) || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', props.onSliceClick ? 'pointer' : 'default')
      .on('click', (_event, d) => {
        props.onSliceClick?.(d.data)
      })

    arcG
      .append('title')
      .text((d) => `${d.data.category_name}: ${formatCurrency(Math.abs(d.data.total_amount_debit))}`)
  })

  const legendParents = () =>
    props.data.filter((cat) => cat.parent_id === null && Math.abs(cat.total_amount_debit) > 0)

  return (
    <div data-testid={props.dataTestId}>
      <p style={{ color: '#ecf0f1', 'text-align': 'center' }}>{props.title ?? 'Distribution'}</p>
      {props.isLoading ? (
        <div
          style={{
            height: '300px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: '#95a5a6',
          }}
        >
          Loading chart…
        </div>
      ) : null}
      <svg ref={(el) => (svgRef = el)} data-testid={`${props.dataTestId}-chart`} />
      <div data-testid={`${props.dataTestId}-legend`} style={{ 'margin-top': '12px' }}>
        <For each={legendParents()}>
          {(item) => (
            <div
              style={{ display: 'flex', 'align-items': 'center', gap: '8px', margin: '4px 0' }}
              data-testid={`${props.dataTestId}-legend-item-${item.category_id}`}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  'border-radius': '50%',
                  background: buildBudgetCategoryColorMap(props.data).get(String(item.category_id)) || '#999',
                }}
              />
              <span style={{ color: '#ecf0f1', 'font-size': '0.85rem' }}>
                {item.category_name} ({formatCurrency(Math.abs(item.total_amount_debit))})
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  )
}
