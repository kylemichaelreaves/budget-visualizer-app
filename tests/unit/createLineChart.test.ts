import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SummaryTypeBase } from '@types'
import { createLineChart } from '@charts/createLineChart'

/** An <svg> inside a parent that reports a usable width (jsdom lays nothing out). */
function mountSvg(width = 600): SVGSVGElement {
  const parent = document.createElement('div')
  parent.getBoundingClientRect = () => ({ width, height: 300, top: 0, left: 0 }) as DOMRect
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  parent.appendChild(svg)
  document.body.appendChild(parent)
  return svg
}

const row = (fields: Partial<SummaryTypeBase>): SummaryTypeBase => ({ total_debit: 10, ...fields })
const dots = (svg: SVGSVGElement) => svg.querySelectorAll('circle.dot')

afterEach(() => {
  document.body.innerHTML = ''
})

describe('createLineChart', () => {
  it('plots one dot per row with a usable date', () => {
    const svg = mountSvg()
    createLineChart(
      svg,
      [row({ period_start: '2026-01-01T00:00:00.000Z' }), row({ period_start: '2026-02-01T00:00:00.000Z' })],
      vi.fn(),
    )
    expect(dots(svg)).toHaveLength(2)
  })

  // CLAUDE.md "Summary rows always carry a string date": a row summaryPointDate
  // can't resolve is dropped, never plotted at a guessed position.
  it('drops rows whose date is missing or unparseable', () => {
    const svg = mountSvg()
    createLineChart(
      svg,
      [
        row({ period_start: '2026-01-01T00:00:00.000Z' }),
        row({}),
        row({ date: 'not a date' }),
        row({ period_start: '   ' }),
        row({ date: '2026-03-01' }),
      ],
      vi.fn(),
    )
    expect(dots(svg)).toHaveLength(2)
  })

  it('draws nothing when no row has a usable date', () => {
    const svg = mountSvg()
    createLineChart(svg, [row({}), row({ date: 'nope' })], vi.fn())
    expect(svg.childElementCount).toBe(0)
  })

  it('draws nothing when the parent has no width', () => {
    const svg = mountSvg(0)
    createLineChart(svg, [row({ date: '2026-03-01' })], vi.fn())
    expect(dots(svg)).toHaveLength(0)
  })

  // The suite runs in America/New_York; a local-midnight bug would emit 2026-02-28.
  it('emits the UTC calendar day of the clicked point', () => {
    const svg = mountSvg()
    const onDateSelected = vi.fn()
    createLineChart(
      svg,
      [row({ date: '2026-03-01' }), row({ period_start: '2026-04-01T00:00:00.000Z' })],
      onDateSelected,
    )

    dots(svg)[0]!.dispatchEvent(new MouseEvent('click'))
    dots(svg)[1]!.dispatchEvent(new MouseEvent('click'))
    expect(onDateSelected.mock.calls).toEqual([['2026-03-01'], ['2026-04-01']])
  })

  it('replaces the previous render instead of stacking on it', () => {
    const svg = mountSvg()
    createLineChart(svg, [row({ date: '2026-03-01' }), row({ date: '2026-03-02' })], vi.fn())
    createLineChart(svg, [row({ date: '2026-03-01' })], vi.fn())
    expect(dots(svg)).toHaveLength(1)
    expect(svg.parentElement!.querySelectorAll('[data-slot="chart-tooltip"]')).toHaveLength(1)
  })
})
