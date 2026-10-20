import { createSignal } from 'solid-js'
import { render, screen, within } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import type { RecurringSeries } from '@types'
import RecurringCategoryBreakdown, {
  apportionTenths,
  segmentWidths,
} from '@components/recurring/RecurringCategoryBreakdown'
import { burnByCategory, monthlyBurn } from '@components/recurring/createRecurringDerivedData'
import { expectNoLiteralColours } from '../setup/expectNoLiteralColours'

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

const inCategory = (
  budgetCategory: string | null,
  monthlyNormalized: number,
  rest: Partial<RecurringSeries> = {},
) => makeSeries({ budgetCategory, monthlyNormalized, ...rest })

function renderBreakdown(series: RecurringSeries[]) {
  return render(() => <RecurringCategoryBreakdown series={series} />)
}

const root = () => screen.getByTestId('recurring-category-breakdown')
const segments = () => within(root()).queryAllByTestId('recurring-breakdown-segment')
const rows = () => within(root()).queryAllByTestId('recurring-breakdown-row')
const bar = () => within(root()).getByTestId('recurring-breakdown-bar')

const cents = (text: string) => Math.round(Number(text.replace(/[$,]/g, '')) * 100)
/** The tenths of a percent a text such as `33.3%` shows. */
const tenths = (text: string) => Math.round(Number(text.replace('%', '')) * 10)
const widthOf = (el: Element) => Number((el.getAttribute('width') ?? '').replace('%', ''))
const xOf = (el: Element) => Number((el.getAttribute('x') ?? '').replace('%', ''))

const displayedAmounts = () =>
  rows().map((r) => within(r).getByTestId('recurring-breakdown-amount').textContent ?? '')
const displayedPcts = () =>
  rows().map((r) => within(r).getByTestId('recurring-breakdown-pct').textContent ?? '')
const headline = () => within(root()).getByTestId('recurring-breakdown-total').textContent ?? ''

/** A spread that is awkward on purpose: a dominant category, fractions of a cent, and a long tail. */
function awkwardSeries(): RecurringSeries[] {
  return [
    inCategory('Housing - Rent', 1650),
    inCategory('Food - Groceries', 311.46),
    inCategory('Food - Groceries', 1.005),
    inCategory('Insurance - Auto', 104.133),
    inCategory('Bills - Phone', 85),
    inCategory('Bills - Utilities', 97.15),
    inCategory('Software', 59.99),
    inCategory('Software', 11.99, { dismissedAt: '2026-10-01T02:30:00.000Z' }),
    inCategory('Entertainment - Streaming', 17.99),
    inCategory('Entertainment - Music', 11.99),
    inCategory('Health - Fitness', 24.99, { status: 'overdue' }),
    inCategory('Shopping', 11.58),
    inCategory(null, 9.99),
    inCategory('Food - Coffee', 0.07),
    inCategory('Health - Wellness', 12.99, { status: 'stopped' }),
  ]
}

describe('RecurringCategoryBreakdown', () => {
  describe('structure', () => {
    it('renders one stacked-bar segment and one list row per category', () => {
      renderBreakdown([
        inCategory('Housing', 1000),
        inCategory('Food', 300),
        inCategory('Food', 100),
        inCategory('Software', 50),
      ])
      expect(segments().map((s) => s.getAttribute('data-category'))).toEqual(['Housing', 'Food', 'Software'])
      expect(rows().map((r) => r.getAttribute('data-category'))).toEqual(['Housing', 'Food', 'Software'])
      const food = rows()[1]
      expect(within(food).getByTestId('recurring-breakdown-name')).toHaveTextContent('Food')
      // Two Food series are one category: $300.00 + $100.00.
      expect(within(food).getByTestId('recurring-breakdown-amount')).toHaveTextContent('$400.00')
      expect(within(food).getByTestId('recurring-breakdown-pct')).toHaveTextContent('27.6%')
    })

    it('lists categories largest first, in the same order as the bar', () => {
      renderBreakdown([inCategory('Small', 5), inCategory('Large', 500), inCategory('Medium', 50)])
      expect(rows().map((r) => r.getAttribute('data-category'))).toEqual(['Large', 'Medium', 'Small'])
      expect(segments().map((s) => s.getAttribute('data-category'))).toEqual(['Large', 'Medium', 'Small'])
    })

    it('groups series with no budget_category under Uncategorized', () => {
      renderBreakdown([inCategory(null, 9.99), inCategory(null, 5), inCategory('Software', 20)])
      const uncategorized = rows().filter((r) => r.getAttribute('data-category') === 'Uncategorized')
      expect(uncategorized).toHaveLength(1)
      expect(within(uncategorized[0]).getByTestId('recurring-breakdown-name')).toHaveTextContent(
        'Uncategorized',
      )
      expect(within(uncategorized[0]).getByTestId('recurring-breakdown-amount')).toHaveTextContent('$14.99')
      expect(segments().filter((s) => s.getAttribute('data-category') === 'Uncategorized')).toHaveLength(1)
      expect(rows()).toHaveLength(2)
    })

    it('is a disclosure, open by default, whose summary names the burn total', () => {
      renderBreakdown([inCategory('Housing', 1650), inCategory('Software', 59.99)])
      const details = within(root()).getByTestId('recurring-breakdown-details')
      expect(details.tagName).toBe('DETAILS')
      expect(details).toHaveAttribute('open')
      const summary = details.querySelector('summary')
      expect(summary).not.toBeNull()
      expect(summary).toHaveTextContent('$1,709.99')
      expect(summary).toHaveTextContent('/mo')
    })
  })

  describe('accessible label', () => {
    it('is an image whose label names each category and its share', () => {
      renderBreakdown([inCategory('Housing', 750), inCategory('Food', 200), inCategory(null, 50)])
      const img = within(root()).getByRole('img')
      expect(img).toBe(bar())
      expect(img).toHaveAccessibleName(
        'Monthly burn by category: Housing 75.0%, Food 20.0%, Uncategorized 5.0%',
      )
    })

    it('quotes the same shares the list shows', () => {
      renderBreakdown(awkwardSeries())
      const label = bar().getAttribute('aria-label') ?? ''
      for (const row of rows()) {
        const name = row.getAttribute('data-category')
        const pct = within(row).getByTestId('recurring-breakdown-pct').textContent
        expect(label).toContain(`${name} ${pct}`)
      }
    })
  })

  describe('the breakdown explains the headline', () => {
    it('has displayed segment amounts that total the displayed headline, to the cent', () => {
      renderBreakdown(awkwardSeries())
      const total = displayedAmounts().reduce((sum, text) => sum + cents(text), 0)
      expect(total).toBe(cents(headline()))
      // Not vacuous: real rounding is in play (1.005 -> 1.01, 104.133 -> 104.13).
      expect(rows().length).toBeGreaterThan(8)
    })

    it('agrees with the burn figure the rest of the page derives', () => {
      const series = awkwardSeries()
      renderBreakdown(series)
      expect(cents(headline())).toBe(Math.round(monthlyBurn(series) * 100))
      expect(displayedAmounts().reduce((sum, text) => sum + cents(text), 0)).toBe(
        Math.round(burnByCategory(series).reduce((sum, row) => sum + row.amount, 0) * 100),
      )
    })

    it('has displayed percentages that total exactly 100', () => {
      renderBreakdown(awkwardSeries())
      expect(displayedPcts().reduce((sum, text) => sum + tenths(text), 0)).toBe(1000)
    })

    it('totals 100 where naive rounding would give 99.9 (three equal thirds)', () => {
      renderBreakdown([inCategory('A', 10), inCategory('B', 10), inCategory('C', 10)])
      // Each is 33.333...%, and three rows of 33.3% would add up to 99.9%.
      expect(displayedPcts().reduce((sum, text) => sum + tenths(text), 0)).toBe(1000)
      expect([...displayedPcts()].sort()).toEqual(['33.3%', '33.3%', '33.4%'])
    })

    it('has segment widths that sum to 100% and tile the bar with no gap', () => {
      renderBreakdown(awkwardSeries())
      const widths = segments().map(widthOf)
      expect(Math.round(widths.reduce((a, b) => a + b, 0) * 10)).toBe(1000)
      let edge = 0
      for (const segment of segments()) {
        expect(xOf(segment)).toBeCloseTo(edge, 5)
        edge += widthOf(segment)
      }
      expect(edge).toBeCloseTo(100, 5)
    })

    it('draws each segment as wide as the share the list shows', () => {
      renderBreakdown([inCategory('A', 600), inCategory('B', 300), inCategory('C', 100)])
      expect(segments().map(widthOf)).toEqual([60, 30, 10])
      expect(displayedPcts()).toEqual(['60.0%', '30.0%', '10.0%'])
    })

    it('counts dismissed series, because dismissal silences the lane, not the ledger', () => {
      renderBreakdown([
        inCategory('Software', 30, { dismissedAt: '2026-10-01T02:30:00.000Z' }),
        inCategory('Food', 10),
      ])
      expect(headline()).toBe('$40.00')
      const software = rows().find((r) => r.getAttribute('data-category') === 'Software')
      expect(software).toBeDefined()
      expect(within(software as HTMLElement).getByTestId('recurring-breakdown-amount')).toHaveTextContent(
        '$30.00',
      )
      expect(displayedAmounts().reduce((sum, text) => sum + cents(text), 0)).toBe(4000)
    })

    it('leaves out stopped series, which are not part of the burn', () => {
      renderBreakdown([
        inCategory('Food', 10),
        inCategory('Gone', 500, { status: 'stopped' }),
        inCategory('Late', 5, { status: 'overdue' }),
      ])
      expect(rows().map((r) => r.getAttribute('data-category'))).toEqual(['Food', 'Late'])
      expect(headline()).toBe('$15.00')
    })

    it('follows the series as they change', () => {
      const [series, setSeries] = createSignal([inCategory('Food', 10)])
      render(() => <RecurringCategoryBreakdown series={series()} />)
      expect(rows()).toHaveLength(1)
      setSeries([inCategory('Food', 10), inCategory('Software', 30)])
      expect(rows()).toHaveLength(2)
      expect(headline()).toBe('$40.00')
      expect(segments()).toHaveLength(2)
    })
  })

  describe('one category dominates', () => {
    it('still draws the small segment of a 97% / 3% split', () => {
      renderBreakdown([inCategory('Housing', 970), inCategory('Software', 30)])
      expect(segments().map(widthOf)).toEqual([97, 3])
      expect(displayedPcts()).toEqual(['97.0%', '3.0%'])
    })

    it('widens a vanishing share to a visible minimum and takes it from the largest segment', () => {
      // Coffee is 0.07 of ~2,300: 0.0%, which would be a sub-pixel sliver.
      renderBreakdown(awkwardSeries())
      const coffee = segments().find((s) => s.getAttribute('data-category') === 'Food - Coffee')
      expect(coffee).toBeDefined()
      expect(widthOf(coffee as Element)).toBeGreaterThanOrEqual(1)
      const widths = segments().map(widthOf)
      expect(Math.round(widths.reduce((a, b) => a + b, 0) * 10)).toBe(1000)
      // The list is not fudged: it still shows the true share.
      const coffeeRow = rows().find((r) => r.getAttribute('data-category') === 'Food - Coffee')
      expect(within(coffeeRow as HTMLElement).getByTestId('recurring-breakdown-pct')).toHaveTextContent(
        '0.0%',
      )
    })

    it('draws a lone category as the whole bar', () => {
      renderBreakdown([inCategory('Housing', 1650), inCategory('Housing', 20)])
      expect(segments()).toHaveLength(1)
      expect(widthOf(segments()[0])).toBe(100)
      expect(displayedPcts()).toEqual(['100.0%'])
    })

    it('keeps every segment at least the minimum when several are tiny', () => {
      renderBreakdown([
        inCategory('Housing', 5000),
        inCategory('A', 0.02),
        inCategory('B', 0.02),
        inCategory('C', 0.02),
      ])
      for (const segment of segments()) expect(widthOf(segment)).toBeGreaterThanOrEqual(1)
      expect(
        Math.round(
          segments()
            .map(widthOf)
            .reduce((a, b) => a + b, 0) * 10,
        ),
      ).toBe(1000)
    })
  })

  describe('empty states', () => {
    it('says there is nothing to break down when there are no series', () => {
      renderBreakdown([])
      expect(within(root()).getByTestId('recurring-breakdown-empty')).toHaveTextContent(
        /no live recurring payments/i,
      )
      expect(within(root()).queryByRole('img')).toBeNull()
      expect(rows()).toHaveLength(0)
      expect(headline()).toBe('$0.00')
    })

    it('says so when every series is stopped', () => {
      renderBreakdown([inCategory('Food', 10, { status: 'stopped' })])
      expect(within(root()).getByTestId('recurring-breakdown-empty')).toBeInTheDocument()
      expect(segments()).toHaveLength(0)
    })

    it('treats live series that cost nothing as nothing to break down', () => {
      renderBreakdown([inCategory('Food', 0)])
      expect(within(root()).getByTestId('recurring-breakdown-empty')).toBeInTheDocument()
      expect(segments()).toHaveLength(0)
    })

    it('does not list a category worth nothing', () => {
      renderBreakdown([inCategory('Food', 10), inCategory('Free', 0)])
      expect(rows().map((r) => r.getAttribute('data-category'))).toEqual(['Food'])
      expect(segments()).toHaveLength(1)
    })
  })

  describe('the bar is drawn at the size intended', () => {
    it('is exactly 12px tall and has no viewBox to rescale it', () => {
      renderBreakdown(awkwardSeries())
      // A viewBox with a different aspect ratio once rendered a 6px meter at ~3px. Without one the
      // `height` is real pixels. jsdom does not lay out, so assert what is set.
      expect(bar()).toHaveAttribute('height', '12')
      expect(bar()).toHaveAttribute('width', '100%')
      expect(bar()).not.toHaveAttribute('viewBox')
      for (const segment of segments()) expect(segment).toHaveAttribute('height', '100%')
    })

    it('gives neighbouring segments different colours and Uncategorized a neutral', () => {
      renderBreakdown(awkwardSeries())
      const fills = segments().map((s) => s.getAttribute('class'))
      fills.slice(1).forEach((fill, i) => expect(fill).not.toBe(fills[i]))
      const uncategorized = segments().find((s) => s.getAttribute('data-category') === 'Uncategorized')
      expect(uncategorized).toHaveClass('text-muted-foreground')
    })
  })

  describe('colours come from design tokens', () => {
    it('carries no literal colour or inline style, populated', () => {
      renderBreakdown(awkwardSeries())
      expectNoLiteralColours(root().outerHTML)
      expect(root().outerHTML).toMatch(/text-chart-1/)
    })

    it('carries no literal colour or inline style, empty', () => {
      renderBreakdown([])
      expectNoLiteralColours(root().outerHTML)
    })
  })
})

describe('apportionTenths', () => {
  it('totals exactly 1000 units whatever the shares', () => {
    for (const shares of [
      [100],
      [50, 50],
      [100 / 3, 100 / 3, 100 / 3],
      [97.04, 2.96],
      [0.04, 0.03, 99.93],
      [14.285714, 14.285714, 14.285714, 14.285714, 14.285714, 14.285714, 14.285716],
    ]) {
      expect(apportionTenths(shares).reduce((a, b) => a + b, 0)).toBe(1000)
    }
  })

  it('gives the leftover to the largest remainders, earlier index first on a tie', () => {
    expect(apportionTenths([100 / 3, 100 / 3, 100 / 3])).toEqual([334, 333, 333])
  })

  it('returns zeros when there is nothing to apportion', () => {
    expect(apportionTenths([])).toEqual([])
    expect(apportionTenths([0, 0])).toEqual([0, 0])
  })
})

describe('segmentWidths', () => {
  it('leaves widths that are already visible alone', () => {
    expect(segmentWidths([600, 300, 100])).toEqual([600, 300, 100])
  })

  it('lifts a sliver to the minimum and takes the difference from the largest', () => {
    expect(segmentWidths([999, 1, 0])).toEqual([980, 10, 10])
  })
})
