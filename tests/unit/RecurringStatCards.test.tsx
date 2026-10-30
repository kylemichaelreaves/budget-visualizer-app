import { render, screen } from '@solidjs/testing-library'
import { createSignal } from 'solid-js'
import { describe, expect, it } from 'vitest'
import type { RecurringSeries } from '@types'
import RecurringStatCards from '@components/recurring/RecurringStatCards'
import { expectNoLiteralColours } from '../setup/expectNoLiteralColours'
import { makeRecurringSeries as makeSeries } from '../setup/makeRecurringSeries'

const TODAY = '2026-10-20'

/**
 * Every figure is distinct so a swapped card cannot pass. Dismissal silences the triage lane only,
 * so the two dismissed series (one active at 99, one stopped at 77) count everywhere but `review`:
 *   burn      = 12.50 + 7.50 + 10.00 + 20.00 (the overdue one) + 99 (dismissed, active) = $149.00
 *   active    = 3 + 1 dismissed = 4
 *   review    = 1 (the overdue series, "late"; a dismissed series is never in the lane)
 *   stopped   = 2 + 1 dismissed = 3, saving 8.25 + 4.00 + 77 = $89.25 (one recent, one long gone)
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
    makeSeries({ monthlyNormalized: 77, status: 'stopped', dismissedAt: '2026-10-01T00:00:00.000Z' }),
  ]
}

const value = (card: string) => screen.getByTestId(`recurring-stat-${card}-value`)
const caption = (card: string) => screen.getByTestId(`recurring-stat-${card}-caption`)

describe('RecurringStatCards', () => {
  it('renders burn, active, needs-review and stopped figures', () => {
    render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)

    expect(screen.getByTestId('recurring-stat-burn')).toHaveTextContent('Monthly burn')
    expect(value('burn')).toHaveTextContent(/^\$149\.00$/)
    expect(caption('burn')).toHaveTextContent('normalized across cadences')

    expect(screen.getByTestId('recurring-stat-active')).toHaveTextContent('Active')
    expect(value('active')).toHaveTextContent(/^4$/)

    expect(screen.getByTestId('recurring-stat-review')).toHaveTextContent('Needs review')
    expect(value('review')).toHaveTextContent(/^1$/)

    expect(screen.getByTestId('recurring-stat-stopped')).toHaveTextContent('Stopped')
    expect(value('stopped')).toHaveTextContent(/^3$/)
  })

  it('names the burn population in its caption, since burn includes overdue series but Active does not', () => {
    render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)
    // $149.00 of burn beside 4 active only reconciles because the overdue series is in the burn.
    expect(caption('burn')).toHaveTextContent(/active \+ overdue/i)
  })

  it('renders the stopped card with the monthly saving it represents', () => {
    render(() => <RecurringStatCards series={mixedSeries()} today={TODAY} />)
    expect(caption('stopped')).toHaveTextContent('$89.25/mo no longer charged')
  })

  it('renders zeroed cards with no series rather than crashing', () => {
    render(() => <RecurringStatCards series={[]} today={TODAY} />)
    expect(value('burn')).toHaveTextContent(/^\$0\.00$/)
    expect(value('active')).toHaveTextContent(/^0$/)
    expect(value('review')).toHaveTextContent(/^0$/)
    expect(value('stopped')).toHaveTextContent(/^0$/)
    expect(caption('stopped')).toHaveTextContent('$0.00/mo no longer charged')
  })

  it('counts a dismissed-but-active series toward burn and Active, but not Needs review', () => {
    const only = [
      makeSeries({ monthlyNormalized: 5, status: 'overdue', dismissedAt: '2026-10-01T00:00:00.000Z' }),
      makeSeries({ monthlyNormalized: 6, dismissedAt: '2026-10-01T00:00:00.000Z' }),
    ]
    render(() => <RecurringStatCards series={only} today={TODAY} />)
    expect(value('burn')).toHaveTextContent(/^\$11\.00$/)
    expect(value('active')).toHaveTextContent(/^1$/) // only the `active` one; overdue is not Active
    expect(value('review')).toHaveTextContent(/^0$/) // the dismissed overdue series is silenced
    expect(value('stopped')).toHaveTextContent(/^0$/)
  })

  it('counts a dismissed-but-stopped series toward Stopped and the saving, not toward burn', () => {
    const only = [
      makeSeries({ monthlyNormalized: 9, status: 'stopped', dismissedAt: '2026-10-01T00:00:00.000Z' }),
    ]
    render(() => <RecurringStatCards series={only} today={TODAY} />)
    expect(value('stopped')).toHaveTextContent(/^1$/)
    expect(caption('stopped')).toHaveTextContent('$9.00/mo no longer charged')
    expect(value('burn')).toHaveTextContent(/^\$0\.00$/)
    expect(value('active')).toHaveTextContent(/^0$/)
    expect(value('review')).toHaveTextContent(/^0$/)
  })

  it('leaves every figure but Needs review unchanged when a series is dismissed', () => {
    const flagged = () =>
      makeSeries({ monthlyNormalized: 20, status: 'overdue', nextExpectedDate: '2026-10-10' })
    const others = () => [
      makeSeries({ monthlyNormalized: 10 }),
      makeSeries({ monthlyNormalized: 3, status: 'stopped' }),
    ]
    const [before, setBefore] = createSignal([flagged(), ...others()])
    render(() => <RecurringStatCards series={before()} today={TODAY} />)
    const read = () => ({
      burn: value('burn').textContent,
      active: value('active').textContent,
      stopped: value('stopped').textContent,
      savings: caption('stopped').textContent,
      review: value('review').textContent,
    })
    const undismissed = read()
    expect(undismissed.review).toBe('1')

    setBefore([{ ...flagged(), dismissedAt: '2026-10-01T00:00:00.000Z' }, ...others()])
    expect(read()).toEqual({ ...undismissed, review: '0' })
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
      expectNoLiteralColours(screen.getByTestId('recurring-stat-cards').outerHTML)
    })
  })
})
