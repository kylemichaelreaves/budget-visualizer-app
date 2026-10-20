import { render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import type { RecurringSeries } from '@types'
import RecurringStatCards from '@components/recurring/RecurringStatCards'

const TODAY = '2026-10-20'

let nextId = 1

/** A healthy, active, non-conflicting series; override only what a test cares about. */
function makeSeries(overrides: Partial<RecurringSeries> = {}): RecurringSeries {
  const id = nextId++
  return {
    id,
    memoId: id,
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

/**
 * Every figure is distinct so a swapped card cannot pass:
 *   burn      = 12.50 + 7.50 + 10.00 + 20.00 (the overdue one) = $50.00
 *   active    = 3
 *   review    = 1 (the overdue series, "late")
 *   stopped   = 2, saving 8.25 + 4.00 = $12.25 (one recent, one long gone: both count)
 * and two dismissed series (one active, one stopped) that must count toward nothing.
 */
function mixedSeries(): RecurringSeries[] {
  return [
    makeSeries({ monthlyNormalized: 12.5 }),
    makeSeries({ monthlyNormalized: 7.5 }),
    makeSeries({ monthlyNormalized: 10 }),
    makeSeries({ monthlyNormalized: 20, status: 'overdue', nextExpectedDate: '2026-10-10' }),
    makeSeries({ monthlyNormalized: 8.25, status: 'stopped', nextExpectedDate: '2026-07-15' }),
    makeSeries({ monthlyNormalized: 4, status: 'stopped', nextExpectedDate: '2025-01-15' }),
    makeSeries({ monthlyNormalized: 99, dismissedAt: '2026-10-01T00:00:00.000Z' }),
    makeSeries({ monthlyNormalized: 99, status: 'stopped', dismissedAt: '2026-10-01T00:00:00.000Z' }),
  ]
}

const value = (card: string) => screen.getByTestId(`recurring-stat-${card}-value`)
const caption = (card: string) => screen.getByTestId(`recurring-stat-${card}-caption`)

describe('RecurringStatCards', () => {
  it('renders burn, active, needs-review and stopped figures', () => {
    render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)

    expect(screen.getByTestId('recurring-stat-burn')).toHaveTextContent('Monthly burn')
    expect(value('burn')).toHaveTextContent(/^\$50\.00$/)
    expect(caption('burn')).toHaveTextContent('Normalized across cadences')

    expect(screen.getByTestId('recurring-stat-active')).toHaveTextContent('Active')
    expect(value('active')).toHaveTextContent(/^3$/)

    expect(screen.getByTestId('recurring-stat-review')).toHaveTextContent('Needs review')
    expect(value('review')).toHaveTextContent(/^1$/)

    expect(screen.getByTestId('recurring-stat-stopped')).toHaveTextContent('Stopped')
    expect(value('stopped')).toHaveTextContent(/^2$/)
  })

  it('renders the stopped card with the monthly saving it represents', () => {
    render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)
    expect(caption('stopped')).toHaveTextContent('$12.25/mo no longer charged')
  })

  it('renders zeroed cards with no series rather than crashing', () => {
    render(() => <RecurringStatCards series={[]} today={TODAY} />)
    expect(value('burn')).toHaveTextContent(/^\$0\.00$/)
    expect(value('active')).toHaveTextContent(/^0$/)
    expect(value('review')).toHaveTextContent(/^0$/)
    expect(value('stopped')).toHaveTextContent(/^0$/)
    expect(caption('stopped')).toHaveTextContent('$0.00/mo no longer charged')
  })

  it('does not count a dismissed series toward any card', () => {
    const only = [makeSeries({ monthlyNormalized: 5, dismissedAt: '2026-10-01T00:00:00.000Z' })]
    render(() => <RecurringStatCards series={only} today={TODAY} />)
    expect(value('burn')).toHaveTextContent(/^\$0\.00$/)
    expect(value('active')).toHaveTextContent(/^0$/)
  })

  it('updates in place when the series prop changes', () => {
    const [series, setSeries] = createSignal([makeSeries({ monthlyNormalized: 3 })])
    render(() => <RecurringStatCards series={series()} today={TODAY} />)
    expect(value('burn')).toHaveTextContent(/^\$3\.00$/)
    setSeries([makeSeries({ monthlyNormalized: 4 }), makeSeries({ monthlyNormalized: 1 })])
    expect(value('burn')).toHaveTextContent(/^\$5\.00$/)
    expect(value('active')).toHaveTextContent(/^2$/)
  })

  describe('colours come from design tokens', () => {
    const TONES: Array<[card: string, figure: string, wrap: string]> = [
      ['burn', 'text-negative', 'bg-negative-muted'],
      ['active', 'text-positive', 'bg-positive-muted'],
      ['review', 'text-caution-foreground', 'bg-caution-muted'],
      ['stopped', 'text-accent-purple', 'bg-accent-purple-muted'],
    ]

    it.each(TONES)('%s card uses the %s figure and %s icon wrap', (card, figure, wrap) => {
      render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)
      expect(value(card)).toHaveClass(figure, 'text-2xl', 'font-bold')
      expect(caption(card)).toHaveClass('text-xs', 'text-muted-foreground')
      const wrapEl = screen.getByTestId(`recurring-stat-${card}`).querySelector(`.${wrap}`)
      expect(wrapEl).not.toBeNull()
      expect(wrapEl).toHaveClass('rounded-full', 'p-2')
    })

    it('carries no literal colour: no inline style, hex/rgb/oklch, arbitrary-value or palette classes', () => {
      render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)
      const html = screen.getByTestId('recurring-stat-cards').outerHTML
      expect(html).not.toMatch(/style=/)
      expect(html).not.toMatch(/#[0-9a-f]{3,8}\b/i)
      expect(html).not.toMatch(/\b(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch)\(/i)
      expect(html).not.toMatch(/\b(?:text|bg|border|fill|stroke|ring)-\[/)
      expect(html).not.toMatch(
        /\b(?:text|bg|border|fill|stroke|ring)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)\b/,
      )
    })
  })
})
