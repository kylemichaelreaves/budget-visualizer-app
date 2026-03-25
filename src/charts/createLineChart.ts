import type { DailyInterval, LineChartDataPoint, SummaryTypeBase } from '@types'
import * as d3 from 'd3'

export function createLineChart(
  el: SVGSVGElement,
  summaries: (SummaryTypeBase | DailyInterval)[],
  onDateSelected: (date: string) => void,
): void {
  const svgElement = el
  d3.select(svgElement).selectAll('*').remove()

  const parentElement = svgElement.parentElement
  const parentWidth = parentElement ? parentElement.getBoundingClientRect().width : 300

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

  const margin = { top: 5, right: 32, bottom: 80, left: 32 }
  const width = parentWidth - margin.left - margin.right
  const height = 150

  const x = d3
    .scaleUtc()
    .range([0, width])
    .domain(d3.extent(chartData, (d) => d.date) as [Date, Date])

  const [minAmount, maxAmount] = d3.extent(chartData, (d) => d.total_debit) as [number, number]

  const y = d3.scaleLinear().range([height, 0]).domain([maxAmount, minAmount])

  const line = d3
    .line<LineChartDataPoint>()
    .x((d) => x(d.date))
    .y((d) => y(d.total_debit))

  const formatDate = d3.utcFormat('%Y-%m-%d')

  const xAxis = d3.axisBottom(x).tickFormat((domainValue) => formatDate(domainValue as Date))

  const yAxis = d3.axisLeft(y)

  const svg = d3
    .select(svgElement)
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.55em')
    .attr('transform', 'rotate(-90)')

  svg
    .append('path')
    .datum(chartData)
    .attr('fill', 'none')
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 2)
    .attr('d', line as unknown as string)

  svg.append('g').attr('class', 'y-axis').call(yAxis)

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  svg
    .selectAll('.dot')
    .data(chartData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('data-testid', (_d, i) => `chart-dot-${i}`)
    .attr('cx', (d) => x(d.date))
    .attr('cy', (d) => y(d.total_debit))
    .attr('r', 4)
    .attr('fill', '#e74c3c')
    .style('cursor', 'pointer')
    .on('click', (_event, d) => {
      onDateSelected(formatDate(d.date))
    })
    .append('title')
    .text((d) => `${formatDate(d.date)}\n${fmtMoney(d.total_debit)}`)
}
