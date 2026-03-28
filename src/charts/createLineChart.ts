import type { DailyInterval, LineChartDataPoint, SummaryTypeBase } from '@types'
import * as d3 from 'd3'

const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const moneyFormatterFull = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function createLineChart(
  el: SVGSVGElement,
  summaries: (SummaryTypeBase | DailyInterval)[],
  onDateSelected: (date: string) => void,
): void {
  const svgElement = el
  d3.select(svgElement).selectAll('*').remove()

  const parentElement = svgElement.parentElement
  if (!parentElement) return
  const parentWidth = parentElement.getBoundingClientRect().width

  const parseDateUTC = d3.utcParse('%Y-%m-%dT%H:%M:%S.%LZ')

  const createDateFromItem = (item: SummaryTypeBase | DailyInterval): Date => {
    if (item.date) {
      const parsed = parseDateUTC(item.date as string)
      if (parsed) return parsed
    }

    if (item.day_number) {
      return new Date(Number(item.year), Number(item.month_number) - 1, Number(item.day_number))
    }

    if (item.week_number) {
      return new Date(Number(item.year), 0, 1 + (Number(item.week_number) - 1) * 7)
    }

    return new Date(Number(item.year), Number(item.month_number) - 1, 1)
  }

  const chartData = summaries.flat().map((item: SummaryTypeBase | DailyInterval) => {
    const date = createDateFromItem(item)
    const total_debit = item.total_amount_debit ?? item.total_debit
    return {
      date,
      total_debit: total_debit as number,
    }
  })

  if (chartData.length === 0) return

  // --- Theme colors ---
  const styles = getComputedStyle(svgElement)
  const textColor = styles.getPropertyValue('color').trim() || '#a1a1aa'
  const gridColor = styles.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.1)'
  const lineColor = '#ef4444' // red-500
  const dotColor = '#ef4444'
  const tooltipBg = styles.getPropertyValue('--popover').trim() || '#1c1c1c'
  const tooltipFg = styles.getPropertyValue('--popover-foreground').trim() || '#fafafa'

  // --- Dimensions ---
  const margin = { top: 8, right: 8, bottom: 20, left: 40 }
  const width = parentWidth - margin.left - margin.right
  const height = 240
  if (width <= 0) return

  // --- Scales ---
  const x = d3
    .scaleUtc()
    .range([0, width])
    .domain(d3.extent(chartData, (d) => d.date) as [Date, Date])

  const absValues = chartData.map((d) => Math.abs(d.total_debit))
  const [minAbs, maxAbs] = d3.extent(absValues) as [number, number]
  const yPad = (maxAbs - minAbs) * 0.1 || 10
  const y = d3
    .scaleLinear()
    .range([height, 0])
    .domain([0, maxAbs + yPad])
    .nice()

  // --- Axes ---
  const fmtShortDate = d3.utcFormat('%b %d')
  const fmtMoney = (n: number) => moneyFormatter.format(n)
  const fmtMoneyFull = (n: number) => moneyFormatterFull.format(n)

  const xAxis = d3
    .axisBottom(x)
    .ticks(Math.min(chartData.length, 8))
    .tickFormat((d) => fmtShortDate(d as Date))
    .tickSizeOuter(0)

  const yAxis = d3
    .axisLeft(y)
    .ticks(6)
    .tickFormat((d) => fmtMoney(d as number))
    .tickSizeOuter(0)

  // --- Root ---
  const svg = d3
    .select(svgElement)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // --- Grid lines ---
  svg
    .append('g')
    .attr('class', 'grid-y')
    .call(
      d3
        .axisLeft(y)
        .ticks(6)
        .tickSize(-width)
        .tickFormat(() => ''),
    )
    .selectAll('line')
    .style('stroke', gridColor)
    .style('stroke-dasharray', '3 3')
    .style('stroke-opacity', 0.5)
  svg.select('.grid-y .domain').remove()

  svg
    .append('g')
    .attr('class', 'grid-x')
    .attr('transform', `translate(0,${height})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(Math.min(chartData.length, 8))
        .tickSize(-height)
        .tickFormat(() => ''),
    )
    .selectAll('line')
    .style('stroke', gridColor)
    .style('stroke-dasharray', '3 3')
    .style('stroke-opacity', 0.5)
  svg.select('.grid-x .domain').remove()

  // --- X axis ---
  const xAxisG = svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
  xAxisG.selectAll('text').style('fill', textColor).style('font-size', '12px')
  xAxisG.selectAll('line').style('stroke', gridColor)
  xAxisG.select('.domain').style('stroke', gridColor)

  // --- Y axis ---
  const yAxisG = svg.append('g').attr('class', 'y-axis').call(yAxis)
  yAxisG.selectAll('text').style('fill', textColor).style('font-size', '12px')
  yAxisG.selectAll('line').style('stroke', gridColor)
  yAxisG.select('.domain').style('stroke', 'none')

  // --- Line ---
  const line = d3
    .line<LineChartDataPoint>()
    .x((d) => x(d.date))
    .y((d) => y(Math.abs(d.total_debit)))
    .curve(d3.curveMonotoneX)

  svg
    .append('path')
    .datum(chartData)
    .attr('fill', 'none')
    .attr('stroke', lineColor)
    .attr('stroke-width', 2)
    .attr('d', line as unknown as string)

  // --- Tooltip (reuse existing or create) ---
  const parent = d3.select(parentElement)
  parent.selectAll('[data-slot="chart-tooltip"]').remove()
  const tooltip = parent
    .append('div')
    .attr('data-slot', 'chart-tooltip')
    .style('position', 'absolute')
    .style('pointer-events', 'none')
    .style('background', tooltipBg)
    .style('color', tooltipFg)
    .style('border', `1px solid ${gridColor}`)
    .style('border-radius', '6px')
    .style('padding', '6px 10px')
    .style('font-size', '12px')
    .style('box-shadow', '0 4px 12px rgba(0,0,0,.3)')
    .style('opacity', '0')
    .style('z-index', '50')
    .style('white-space', 'nowrap')
    .style('transition', 'opacity 0.15s')

  const formatDate = d3.utcFormat('%Y-%m-%d')

  // --- Dots ---
  svg
    .selectAll('.dot')
    .data(chartData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('data-testid', (_d, i) => `chart-dot-${i}`)
    .attr('cx', (d) => x(d.date))
    .attr('cy', (d) => y(Math.abs(d.total_debit)))
    .attr('r', 4)
    .attr('fill', dotColor)
    .attr('stroke', tooltipBg)
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function (_event, d) {
      d3.select(this).transition().duration(150).attr('r', 6)
      const svgRect = svgElement.getBoundingClientRect()
      const parentRect = parentElement.getBoundingClientRect()
      const tooltipNode = tooltip.node()!
      tooltipNode.textContent = ''
      const strong = document.createElement('strong')
      strong.textContent = fmtShortDate(d.date)
      tooltipNode.appendChild(strong)
      tooltipNode.appendChild(document.createElement('br'))
      tooltipNode.appendChild(document.createTextNode(fmtMoneyFull(Math.abs(d.total_debit))))
      tooltip
        .style('opacity', '1')
        .style('left', `${x(d.date) + margin.left + svgRect.left - parentRect.left - 40}px`)
        .style('top', `${y(Math.abs(d.total_debit)) + margin.top + svgRect.top - parentRect.top - 48}px`)
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(150).attr('r', 4)
      tooltip.style('opacity', '0')
    })
    .on('click', (_event, d) => {
      onDateSelected(formatDate(d.date))
    })
}
