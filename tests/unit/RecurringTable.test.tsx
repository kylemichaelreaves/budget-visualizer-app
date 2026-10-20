import { createSignal } from 'solid-js'
import { render, screen, within } from '@solidjs/testing-library'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RecurringAmountPoint, RecurringSeries } from '@types'
import { expectNoLiteralColours } from '../setup/expectNoLiteralColours'

const monthlyAmountSpy = vi.hoisted(() => vi.fn<(s: RecurringSeries) => number>())

// Real derived-data module, except `monthlyAmount`, which a test can override with a sentinel.
vi.mock('@components/recurring/createRecurringDerivedData', async (importActual) => {
  const actual = await importActual<typeof import('@components/recurring/createRecurringDerivedData')>()
  monthlyAmountSpy.mockImplementation(actual.monthlyAmount)
  return { ...actual, monthlyAmount: (s: RecurringSeries) => monthlyAmountSpy(s) }
})

const derived = await vi.importActual<typeof import('@components/recurring/createRecurringDerivedData')>(
  '@components/recurring/createRecurringDerivedData',
)
const { default: RecurringTable } = await import('@components/recurring/RecurringTable')
const { default: RecurringSparkline } = await import('@components/recurring/RecurringSparkline')

let nextId = 1

function makeSeries(overrides: Partial<RecurringSeries> = {}): RecurringSeries {
  const id = nextId++
  return {
    id,
    memoId: id + 1000,
    memoName: `Memo ${id}`,
    avatarS3Url: null,
    cadence: 'monthly',
    confidence: 0.9,
    occurrenceCount: 6,
    firstDate: '2026-04-15',
    lastDate: '2026-10-15',
    nextExpectedDate: '2026-11-15',
    latestAmount: 10,
    monthlyNormalized: 10,
    amountHistory: [
      { date: '2026-09-15', amount: 10 },
      { date: '2026-10-15', amount: 10 },
    ],
    budgetCategory: 'Entertainment',
    status: 'active',
    dismissedAt: null,
    detectedAt: '2026-10-19T03:00:00.000Z',
    memoRecurring: true,
    memoFrequency: 'monthly',
    ...overrides,
  }
}

const row = (s: RecurringSeries) => screen.getByTestId(`recurring-table-row-${s.id}`)
const cell = (s: RecurringSeries, column: string) => within(row(s)).getByTestId(`recurring-table-${column}`)

beforeEach(() => {
  monthlyAmountSpy.mockReset()
  monthlyAmountSpy.mockImplementation(derived.monthlyAmount)
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('RecurringTable', () => {
  it('renders memo, cadence, latest, per-month, next, status and confidence', () => {
    const s = makeSeries({
      memoName: 'Netflix',
      budgetCategory: 'Streaming',
      cadence: 'monthly',
      latestAmount: 15.99,
      monthlyNormalized: 15.99,
      nextExpectedDate: '2026-11-15',
      confidence: 0.9,
    })
    render(() => <RecurringTable series={[s]} />)

    expect(cell(s, 'memo')).toHaveTextContent('Netflix')
    expect(cell(s, 'memo')).toHaveTextContent('Streaming')
    expect(within(cell(s, 'memo')).getByTestId('recurring-avatar')).toHaveTextContent('NE')
    expect(cell(s, 'cadence')).toHaveTextContent('Monthly')
    expect(cell(s, 'latest')).toHaveTextContent('$15.99')
    expect(cell(s, 'monthly')).toHaveTextContent('$15.99')
    expect(cell(s, 'next')).toHaveTextContent('15 Nov')
    expect(cell(s, 'status')).toHaveTextContent('Active')
    expect(cell(s, 'confidence')).toHaveTextContent('90%')
  })

  it('has a header for every column', () => {
    render(() => <RecurringTable series={[makeSeries()]} />)
    const headers = screen.getAllByRole('columnheader').map((h) => h.textContent?.trim())
    expect(headers).toEqual([
      'Memo',
      'Cadence',
      'Latest',
      'Per month',
      'Amount history',
      'Next expected',
      'Status',
      'Confidence',
    ])
  })

  it('shows an uncategorised series as such', () => {
    const s = makeSeries({ budgetCategory: null })
    render(() => <RecurringTable series={[s]} />)
    expect(cell(s, 'memo')).toHaveTextContent('Uncategorized')
  })

  it('falls back to a readable name for a memo with no name', () => {
    const s = makeSeries({ memoName: null })
    render(() => <RecurringTable series={[s]} />)
    expect(within(cell(s, 'memo')).getByText('Unnamed memo')).toBeInTheDocument()
    expect(within(cell(s, 'memo')).getByTestId('recurring-avatar')).toHaveTextContent('?')
  })

  it('renders one row per series, in the order given', () => {
    const a = makeSeries({ memoName: 'Alpha' })
    const b = makeSeries({ memoName: 'Bravo' })
    const c = makeSeries({ memoName: 'Charlie' })
    render(() => <RecurringTable series={[b, c, a]} />)
    const names = screen.getAllByTestId('recurring-table-row-name').map((el) => el.textContent)
    expect(names).toEqual(['Bravo', 'Charlie', 'Alpha'])
  })

  it('sinks stopped rows to the bottom, keeping the given order within each group', () => {
    const live1 = makeSeries({ memoName: 'Live1', monthlyNormalized: 50 })
    const stopped1 = makeSeries({ memoName: 'Stopped1', status: 'stopped', monthlyNormalized: 40 })
    const late = makeSeries({ memoName: 'Late', status: 'overdue', monthlyNormalized: 30 })
    const stopped2 = makeSeries({ memoName: 'Stopped2', status: 'stopped', monthlyNormalized: 20 })
    const live2 = makeSeries({ memoName: 'Live2', monthlyNormalized: 10 })
    render(() => <RecurringTable series={[live1, stopped1, late, stopped2, live2]} />)
    const names = screen.getAllByTestId('recurring-table-row-name').map((el) => el.textContent)
    // Not re-sorted by amount: Live1 (50) stays ahead of Late (30) and Live2 (10) as given.
    expect(names).toEqual(['Live1', 'Late', 'Live2', 'Stopped1', 'Stopped2'])
  })

  it('moves a row to the stopped group when a refetch stops it, without remounting it', () => {
    const a = makeSeries({ memoName: 'Alpha' })
    const b = makeSeries({ memoName: 'Bravo' })
    const [list, setList] = createSignal([a, b])
    render(() => <RecurringTable series={list()} />)
    const rowA = row(a)
    setList([{ ...a, status: 'stopped' as const }, { ...b }])
    expect(screen.getAllByTestId('recurring-table-row-name').map((el) => el.textContent)).toEqual([
      'Bravo',
      'Alpha',
    ])
    expect(row(a).dataset.status).toBe('stopped')
    expect(rowA.dataset.status).toBe('stopped')
  })

  describe('dismissed series', () => {
    it('keeps a dismissed series in the table, visibly marked, still carrying its monthly figure', () => {
      const dismissed = makeSeries({
        memoName: 'Gym',
        monthlyNormalized: 30,
        latestAmount: 30,
        dismissedAt: '2026-10-01T02:30:00.000Z',
      })
      const live = makeSeries({ memoName: 'Netflix' })
      render(() => <RecurringTable series={[dismissed, live]} />)

      expect(row(dismissed)).toBeInTheDocument()
      expect(row(dismissed)).toHaveAttribute('data-dismissed', 'true')
      expect(within(row(dismissed)).getByTestId('recurring-table-dismissed')).toHaveTextContent(/dismissed/i)
      expect(cell(dismissed, 'monthly')).toHaveTextContent('$30.00')

      expect(row(live)).toHaveAttribute('data-dismissed', 'false')
      expect(within(row(live)).queryByTestId('recurring-table-dismissed')).toBeNull()
    })

    it('never formats the dismissal instant as a calendar date', () => {
      // 02:30Z on 1 Oct is 22:30 on 30 Sep in New York. A date helper would print one of these.
      const s = makeSeries({ dismissedAt: '2026-10-01T02:30:00.000Z' })
      render(() => <RecurringTable series={[s]} />)
      const text = row(s).textContent ?? ''
      expect(text).not.toMatch(/2026-10-01/)
      expect(text).not.toMatch(/\b1 Oct\b/)
      expect(text).not.toMatch(/\b30 Sep\b/)
    })
  })

  describe('stopped series', () => {
    it('renders a dash for per-month and next on a stopped series', () => {
      const s = makeSeries({
        status: 'stopped',
        monthlyNormalized: 12.34,
        nextExpectedDate: '2026-08-15',
      })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'monthly')).toHaveTextContent('—')
      expect(cell(s, 'monthly')).not.toHaveTextContent('12.34')
      expect(cell(s, 'next')).toHaveTextContent('—')
      expect(cell(s, 'next')).not.toHaveTextContent('Aug')
    })

    it('dims a stopped row, and only a stopped row', () => {
      const stopped = makeSeries({ status: 'stopped' })
      const active = makeSeries()
      const late = makeSeries({ status: 'overdue' })
      render(() => <RecurringTable series={[stopped, active, late]} />)
      expect(row(stopped)).toHaveClass('opacity-60')
      expect(row(active)).not.toHaveClass('opacity-60')
      expect(row(late)).not.toHaveClass('opacity-60')
    })

    it('dashes the trailing sparkline segment of a stopped row only', () => {
      const stopped = makeSeries({ status: 'stopped' })
      const active = makeSeries()
      render(() => <RecurringTable series={[stopped, active]} />)
      expect(row(stopped).querySelectorAll('[stroke-dasharray]')).toHaveLength(1)
      expect(row(active).querySelectorAll('[stroke-dasharray]')).toHaveLength(0)
    })
  })

  describe('money', () => {
    it('renders the per-month figure for a weekly series, not the charge amount', () => {
      const s = makeSeries({ cadence: 'weekly', latestAmount: 5, monthlyNormalized: 21.67 })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'latest')).toHaveTextContent('$5.00')
      expect(cell(s, 'monthly')).toHaveTextContent('$21.67')
      expect(cell(s, 'monthly')).not.toHaveTextContent('$5.00')
    })

    it('takes the per-month figure from monthlyAmount, not from monthlyNormalized', () => {
      monthlyAmountSpy.mockReturnValue(42.42)
      const s = makeSeries({ monthlyNormalized: 15.99 })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'monthly')).toHaveTextContent('$42.42')
    })

    it('rounds the per-month figure to whole cents the way the headline does', () => {
      // 1.005 is the classic binary-float trap: only the cent-exact boundary reads it as 1.01.
      const s = makeSeries({ monthlyNormalized: 1.005, latestAmount: 1.005 })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'monthly')).toHaveTextContent('$1.01')
    })
  })

  describe('as of last scan', () => {
    it.each([
      ['late', 'overdue' as const, 'Late'],
      ['stopped', 'stopped' as const, 'Stopped'],
    ])('qualifies a %s status as a last-scan snapshot', (_label, status, text) => {
      const s = makeSeries({ status })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'status')).toHaveTextContent(text)
      const caption = within(cell(s, 'status')).getByTestId('recurring-table-as-of-scan')
      expect(caption).toHaveTextContent(/as of last scan/i)
      expect(caption).toHaveAttribute('title', 'Status from the last scan. Rescan to refresh it.')
    })

    it('does not qualify an active status', () => {
      const s = makeSeries()
      render(() => <RecurringTable series={[s]} />)
      expect(within(cell(s, 'status')).queryByTestId('recurring-table-as-of-scan')).toBeNull()
    })
  })

  describe('dates', () => {
    it('shows the next expected date as a calendar day, with no timezone shift', () => {
      const s = makeSeries({ nextExpectedDate: '2026-11-01' })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'next')).toHaveTextContent('1 Nov')
    })

    it('shows a dash when there is no next expected date', () => {
      const s = makeSeries({ nextExpectedDate: null })
      render(() => <RecurringTable series={[s]} />)
      expect(cell(s, 'next')).toHaveTextContent('—')
    })
  })

  describe('confidence', () => {
    it('shows a bar and its value, so a weak detection is visibly weak', () => {
      const strong = makeSeries({ confidence: 0.9 })
      const weak = makeSeries({ confidence: 0.35 })
      render(() => <RecurringTable series={[strong, weak]} />)

      const barWidth = (s: RecurringSeries) =>
        Number(
          within(cell(s, 'confidence')).getByTestId('recurring-table-confidence-bar').getAttribute('width'),
        )
      expect(cell(weak, 'confidence')).toHaveTextContent('35%')
      expect(barWidth(weak)).toBeLessThan(barWidth(strong))
      expect(barWidth(weak) / barWidth(strong)).toBeCloseTo(0.35 / 0.9, 5)
      expect(within(row(weak)).getByTestId('recurring-table-confidence-meter')).toHaveAttribute(
        'data-weak',
        'true',
      )
      expect(within(row(strong)).getByTestId('recurring-table-confidence-meter')).toHaveAttribute(
        'data-weak',
        'false',
      )
    })

    it('lets the visible percentage carry the value, so the bar is not announced twice', () => {
      const s = makeSeries({ confidence: 0.9 })
      render(() => <RecurringTable series={[s]} />)
      const meter = within(cell(s, 'confidence')).getByTestId('recurring-table-confidence-meter')
      expect(meter).toHaveAttribute('aria-hidden', 'true')
      expect(meter).not.toHaveAttribute('aria-label')
      expect(cell(s, 'confidence')).toHaveTextContent('90%')
    })

    it('clamps an out-of-range confidence into the bar', () => {
      const s = makeSeries({ confidence: 1.4 })
      render(() => <RecurringTable series={[s]} />)
      const bar = within(cell(s, 'confidence')).getByTestId('recurring-table-confidence-bar')
      expect(Number(bar.getAttribute('width'))).toBeLessThanOrEqual(100)
    })
  })

  describe('layout', () => {
    it('right-aligns the numeric columns and sets them in tabular figures', () => {
      const s = makeSeries()
      render(() => <RecurringTable series={[s]} />)
      for (const column of ['latest', 'monthly', 'confidence']) {
        expect(cell(s, column)).toHaveClass('text-right', 'tabular-nums')
      }
      for (const name of ['Latest', 'Per month', 'Confidence']) {
        expect(screen.getByRole('columnheader', { name })).toHaveClass('text-right')
      }
    })

    it('scrolls horizontally inside its own container at narrow widths', () => {
      render(() => <RecurringTable series={[makeSeries()]} />)
      const table = screen.getByRole('table')
      // jsdom does not lay out, so assert the contract: a scroll container around a table that
      // refuses to squash below a minimum width.
      const container = table.closest('[data-slot="table-container"]')
      expect(container).not.toBeNull()
      expect(container).toHaveClass('overflow-x-auto')
      expect(table.className).toMatch(/\bmin-w-/)
    })
  })

  it('renders an empty state when no series exist', () => {
    render(() => <RecurringTable series={[]} />)
    expect(screen.getByTestId('recurring-table-empty')).toHaveTextContent(/no recurring payments/i)
    expect(screen.queryByRole('table')).toBeNull()
  })

  describe('row identity', () => {
    it('keeps a row mounted when a refetch hands back new objects with the same ids', () => {
      const a = makeSeries({ memoName: 'Alpha' })
      const b = makeSeries({ memoName: 'Bravo' })
      const [list, setList] = createSignal([a, b])
      render(() => <RecurringTable series={list()} />)

      const rowA = row(a)
      const rowB = row(b)
      // A refetch: structurally the same data, brand-new objects, one price changed.
      setList([{ ...a }, { ...b, latestAmount: 99 }])

      expect(row(a)).toBe(rowA)
      expect(row(b)).toBe(rowB)
      expect(cell(b, 'latest')).toHaveTextContent('$99.00')
    })

    it('adds and removes rows by id without disturbing the rest', () => {
      const a = makeSeries({ memoName: 'Alpha' })
      const b = makeSeries({ memoName: 'Bravo' })
      const c = makeSeries({ memoName: 'Charlie' })
      const [list, setList] = createSignal([a, b])
      render(() => <RecurringTable series={list()} />)
      const rowB = row(b)

      setList([{ ...b }, { ...c }])
      expect(screen.queryByTestId(`recurring-table-row-${a.id}`)).toBeNull()
      expect(row(b)).toBe(rowB)
      expect(row(c)).toBeInTheDocument()
      expect(screen.getAllByTestId('recurring-table-row-name').map((el) => el.textContent)).toEqual([
        'Bravo',
        'Charlie',
      ])
    })
  })

  it('carries no literal colour', () => {
    const list = [
      makeSeries({ status: 'overdue' }),
      makeSeries({ status: 'stopped', dismissedAt: '2026-10-01T02:30:00.000Z' }),
      makeSeries({ confidence: 0.3 }),
      makeSeries({
        amountHistory: [
          { date: '2026-09-15', amount: 5 },
          { date: '2026-10-15', amount: 9 },
        ],
      }),
    ]
    const { container } = render(() => <RecurringTable series={list} />)
    expectNoLiteralColours(container.innerHTML)
  })
})

describe('RecurringSparkline', () => {
  const points = (history: RecurringAmountPoint[], stopped = false) => {
    const view = render(() => <RecurringSparkline history={history} stopped={stopped} />)
    const svg = view.container.querySelector('svg') as SVGSVGElement
    return { svg, ...view }
  }
  const circles = (svg: SVGSVGElement) => [...svg.querySelectorAll('circle')]
  const polylineYs = (svg: SVGSVGElement) =>
    (svg.querySelector('polyline')?.getAttribute('points') ?? '')
      .trim()
      .split(/\s+/)
      .map((pair) => Number(pair.split(',')[1]))

  const RISE: RecurringAmountPoint[] = [
    { date: '2026-08-15', amount: 10 },
    { date: '2026-09-15', amount: 10 },
    { date: '2026-10-15', amount: 12 },
  ]
  const FALL: RecurringAmountPoint[] = [
    { date: '2026-08-15', amount: 12 },
    { date: '2026-09-15', amount: 12 },
    { date: '2026-10-15', amount: 10 },
  ]

  it('draws one point per amount-history entry', () => {
    const history: RecurringAmountPoint[] = [
      { date: '2026-07-15', amount: 10 },
      { date: '2026-08-15', amount: 11 },
      { date: '2026-09-15', amount: 12 },
      { date: '2026-10-15', amount: 13 },
    ]
    const { svg } = points(history)
    expect(circles(svg)).toHaveLength(4)
    expect(svg.querySelector('polyline')?.getAttribute('points')?.trim().split(/\s+/)).toHaveLength(4)
  })

  it('has an explicit viewBox, an accessible name, and does not rely on a CSS size to be drawn', () => {
    const { svg } = points(RISE)
    expect(svg.getAttribute('viewBox')).toMatch(/^0 0 \d+ \d+$/)
    expect(svg).toHaveAttribute('role', 'img')
    expect(svg.getAttribute('aria-label')).toMatch(/\$10\.00.*\$12\.00/)
  })

  it('gives every drawn shape an explicit fill', () => {
    const { svg } = points(RISE, true)
    const shapes = svg.querySelectorAll('polyline, line, circle, rect, path')
    expect(shapes.length).toBeGreaterThan(0)
    for (const shape of shapes) {
      expect(shape.getAttribute('fill'), shape.outerHTML).toBeTruthy()
    }
  })

  it('emphasises the final point', () => {
    const { svg } = points(RISE)
    const radii = circles(svg).map((c) => Number(c.getAttribute('r')))
    const last = radii[radii.length - 1]
    for (const r of radii.slice(0, -1)) expect(last).toBeGreaterThan(r)
    expect(circles(svg)[radii.length - 1]).toHaveAttribute('data-final', 'true')
  })

  it('draws a flat line when the amount never changed', () => {
    const { svg } = points([
      { date: '2026-08-15', amount: 10 },
      { date: '2026-09-15', amount: 10 },
      { date: '2026-10-15', amount: 10 },
    ])
    const ys = polylineYs(svg)
    expect(ys).toHaveLength(3)
    expect(new Set(ys).size).toBe(1)
    expect(ys.every(Number.isFinite)).toBe(true)
    expect(svg).toHaveAttribute('data-direction', 'flat')
  })

  it('draws a single-entry history without error', () => {
    const { svg } = points([{ date: '2026-10-15', amount: 10 }])
    expect(circles(svg)).toHaveLength(1)
    expect(svg.querySelector('polyline')).toBeNull()
    expect(Number(circles(svg)[0].getAttribute('cx'))).toBeGreaterThan(0)
    expect(Number.isFinite(Number(circles(svg)[0].getAttribute('cy')))).toBe(true)
  })

  it('draws an empty history without error', () => {
    const { svg } = points([])
    expect(svg).toBeInTheDocument()
    expect(circles(svg)).toHaveLength(0)
  })

  it('colours a rise and a fall differently, from theme tokens', () => {
    const rise = points(RISE)
    const fall = points(FALL)
    expect(rise.svg).toHaveAttribute('data-direction', 'up')
    expect(fall.svg).toHaveAttribute('data-direction', 'down')
    expect(rise.svg).toHaveClass('text-negative')
    expect(fall.svg).toHaveClass('text-positive')
    const flat = points([
      { date: '2026-09-15', amount: 10 },
      { date: '2026-10-15', amount: 10 },
    ])
    expect(flat.svg).toHaveClass('text-muted-foreground')
    // All three directions are told apart: a price cut must not look like nothing happened.
    const classes = [rise, fall, flat].map((v) => v.svg.getAttribute('class'))
    expect(new Set(classes).size).toBe(3)
    expect(rise.svg.getAttribute('class')).not.toBe(fall.svg.getAttribute('class'))
    expectNoLiteralColours(rise.svg.outerHTML)
    expectNoLiteralColours(fall.svg.outerHTML)
  })

  it('judges direction from the last step by date, whatever the array order', () => {
    const { svg } = points([...RISE].reverse())
    expect(svg).toHaveAttribute('data-direction', 'up')
  })

  it('scales so a rise climbs and a fall drops (SVG y grows downward)', () => {
    const rise = polylineYs(points(RISE).svg)
    const fall = polylineYs(points(FALL).svg)
    expect(rise[2]).toBeLessThan(rise[0])
    expect(fall[2]).toBeGreaterThan(fall[0])
  })

  it.each([
    ['a rise', RISE],
    ['a fall', FALL],
    ['a flat history', [RISE[0], { ...RISE[1], amount: 10 }]],
    ['a single entry', [RISE[0]]],
    [
      'a steep climb',
      [
        { date: '2026-09-15', amount: 0.01 },
        { date: '2026-10-15', amount: 9999 },
      ],
    ],
  ])('keeps every point, with its radius, inside the viewBox for %s', (_label, history) => {
    const { svg } = points(history)
    const [, , width, height] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number)
    expect([width, height]).toEqual([80, 24])
    expect(circles(svg).length).toBeGreaterThan(0)
    for (const c of circles(svg)) {
      const [cx, cy, r] = ['cx', 'cy', 'r'].map((a) => Number(c.getAttribute(a)))
      expect(cx - r, c.outerHTML).toBeGreaterThanOrEqual(0)
      expect(cx + r, c.outerHTML).toBeLessThanOrEqual(width)
      expect(cy - r, c.outerHTML).toBeGreaterThanOrEqual(0)
      expect(cy + r, c.outerHTML).toBeLessThanOrEqual(height)
    }
  })

  it('dashes only the trailing segment of a stopped series', () => {
    const { svg } = points(RISE, true)
    const dashed = svg.querySelectorAll('[stroke-dasharray]')
    expect(dashed).toHaveLength(1)
    // The solid run keeps every earlier point, the dashed segment joins the last two.
    expect(svg.querySelector('polyline')?.getAttribute('points')?.trim().split(/\s+/)).toHaveLength(2)
    expect(dashed[0].tagName.toLowerCase()).toBe('line')
  })

  it('draws a stopped two-point history as a single dashed segment', () => {
    const { svg } = points(RISE.slice(1), true)
    expect(svg.querySelectorAll('[stroke-dasharray]')).toHaveLength(1)
    expect(svg.querySelector('polyline')).toBeNull()
  })

  it('draws no dashes for a series that has not stopped', () => {
    const { svg } = points(RISE, false)
    expect(svg.querySelectorAll('[stroke-dasharray]')).toHaveLength(0)
  })
})
