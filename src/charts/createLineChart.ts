import type { DailyInterval, LineChartDataPoint, SummaryTypeBase } from '@types'
import * as d3 from 'd3'
import { formatUsd, formatUsdCompact } from '@utils/formatUsd'
import {
  CHART_TOOLTIP_CLASS,
  hideChartTooltip,
  setChartTooltipContent,
  showChartTooltipAt,
} from './chartTooltip'
import { summaryPointDate } from './summaryPointDate'

export function createLineChart(
  el: SVGSVGElement,
  summaries: (SummaryTypeBase | DailyInterval)[],
  onDateSelected: (date: string) => void,
  options?: { stackedDateLabels?: boolean },
): void {
  const svgElement = el
  d3.select(svgElement).selectAll('*').remove()

  const parentElement = svgElement.parentElement
  if (!parentElement) return
  const parentWidth = parentElement.getBoundingClientRect().width

  const chartData = summaries
    .flat()
    .map((item: SummaryTypeBase | DailyInterval) => ({
      date: summaryPointDate(item),
      // pg `numeric` sums can arrive as strings; coerce, and let a missing total
      // become NaN so the filter below drops it instead of drawing a NaN path.
      total_debit: Number(item.total_amount_debit ?? item.total_debit),
    }))
    // Rows with no parseable date or total are dropped rather than plotted at a
    // guessed position — see summaryPointDate.
    .filter((d): d is LineChartDataPoint => d.date !== null && Number.isFinite(d.total_debit))

  if (chartData.length === 0) return

  // --- Theme colors ---
  const styles = getComputedStyle(svgElement)
  const textColor = styles.getPropertyValue('color').trim() || '#a1a1aa'
  const gridColor = styles.getPropertyValue('--border').trim() || 'rgba(255,255,255,0.1)'
  const lineColor =
    styles.getPropertyValue('--line-chart').trim() ||
    styles.getPropertyValue('--destructive').trim() ||
    '#ef4444'
  const dotColor = lineColor
  const dotStroke = styles.getPropertyValue('--popover').trim() || '#1c1c1c'

  // --- Dimensions ---
  const stacked = options?.stackedDateLabels ?? false
  const margin = { top: 8, right: 8, bottom: stacked ? 42 : 30, left: 45 }
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
  const fmtMonth = d3.utcFormat('%b')
  const fmtYear = d3.utcFormat('%y')
  const fmtDayMonth = d3.utcFormat('%b %d')
  const fmtShortDate = stacked ? (d: Date) => `${fmtMonth(d)} ${fmtYear(d)}` : (d: Date) => fmtDayMonth(d)

  const xAxis = d3
    .axisBottom(x)
    .ticks(Math.min(chartData.length, 8))
    .tickFormat((d) => fmtShortDate(d as Date))
    .tickSizeOuter(0)

  const formatXTickMultiLine = (g: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    g.selectAll('.tick text').each(function () {
      const text = d3.select(this)
      const label = text.text()
      const [month, year] = label.split(' ')
      text.text('')
      text.append('tspan').attr('x', 0).attr('dy', '0').text(month)
      text.append('tspan').attr('x', 0).attr('dy', '1.2em').text(year)
    })
  }

  const yAxis = d3
    .axisLeft(y)
    .ticks(5)
    .tickFormat((d) => formatUsdCompact(d as number))
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
  if (stacked) formatXTickMultiLine(xAxisG)
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
    .attr('d', line)

  // --- Tooltip (reuse existing or create) ---
  const parent = d3.select(parentElement)
  parent.selectAll('[data-slot="chart-tooltip"]').remove()
  const tooltipNode = parent
    .append('div')
    .attr('data-slot', 'chart-tooltip')
    .attr('class', CHART_TOOLTIP_CLASS)
    .node()!

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
    .attr('stroke', dotStroke)
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseenter', function (_event, d) {
      d3.select(this).transition().duration(150).attr('r', 6)
      const svgRect = svgElement.getBoundingClientRect()
      const parentRect = parentElement.getBoundingClientRect()
      setChartTooltipContent(tooltipNode, fmtShortDate(d.date), formatUsd(Math.abs(d.total_debit)))
      // Centered above the dot (the -40 / -48 nudge clears the dot and the tooltip's own height).
      showChartTooltipAt(
        tooltipNode,
        x(d.date) + margin.left + svgRect.left - parentRect.left - 40,
        y(Math.abs(d.total_debit)) + margin.top + svgRect.top - parentRect.top - 48,
      )
    })
    .on('mouseleave', function () {
      d3.select(this).transition().duration(150).attr('r', 4)
      hideChartTooltip(tooltipNode)
    })
    .on('click', (_event, d) => {
      onDateSelected(formatDate(d.date))
    })
}
