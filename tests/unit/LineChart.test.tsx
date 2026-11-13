import { render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { SummaryTypeBase } from '@types'
import LineChart from '@charts/LineChart'
import LineChartSkeleton from '@charts/LineChartSkeleton'
import { stubResizeObserver } from '../setup/stubResizeObserver'

// createLineChart measures the wrapper itself; give jsdom's 0-width layout a size.
const realRect = HTMLElement.prototype.getBoundingClientRect
let restore: () => void
beforeAll(() => {
  restore = stubResizeObserver()
  HTMLElement.prototype.getBoundingClientRect = () =>
    ({ width: 600, height: 300, top: 0, left: 0 }) as DOMRect
})
afterAll(() => {
  restore()
  HTMLElement.prototype.getBoundingClientRect = realRect
})

const rows: SummaryTypeBase[] = [
  { period_start: '2026-01-01T00:00:00.000Z', total_debit: 10 },
  { period_start: '2026-02-01T00:00:00.000Z', total_debit: 20 },
]
const svg = () => screen.getByTestId('line-chart-svg')
const tooltips = () => document.querySelectorAll('[data-slot="chart-tooltip"]')

describe('LineChart', () => {
  it('draws once the wrapper has a width', async () => {
    render(() => <LineChart summaries={rows} handleOnClickSelection={vi.fn()} />)
    await Promise.resolve()
    expect(svg().querySelectorAll('circle.dot')).toHaveLength(2)
    expect(tooltips()).toHaveLength(1)
  })

  it('clears the plot and its tooltip when the data empties', async () => {
    const [data, setData] = createSignal(rows)
    render(() => <LineChart summaries={data()} handleOnClickSelection={vi.fn()} />)
    await Promise.resolve()
    setData([])
    expect(svg().innerHTML).toBe('')
    expect(tooltips()).toHaveLength(0)
  })

  it('removes its tooltip on unmount', async () => {
    const { unmount } = render(() => <LineChart summaries={rows} handleOnClickSelection={vi.fn()} />)
    await Promise.resolve()
    unmount()
    expect(tooltips()).toHaveLength(0)
  })
})

describe('LineChartSkeleton', () => {
  it('renders the plot placeholder and four axis-label placeholders', () => {
    render(() => <LineChartSkeleton dataTestId="sk" class="p-4" />)
    const sk = screen.getByTestId('sk')
    expect(sk).toHaveClass('p-4')
    expect(sk.querySelectorAll('[data-slot="skeleton"], .animate-pulse').length).toBeGreaterThanOrEqual(5)
  })
})
