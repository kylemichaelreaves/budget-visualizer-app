import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import LatencyBars from '@components/observability/infrastructure/LatencyBars'
import { latencySeries } from '@components/observability/infrastructure/observabilityStoryFixtures'
import { expectNoLiteralColours } from '../setup/expectNoLiteralColours'

describe('LatencyBars', () => {
  it('draws one bar per non-null point and marks bars over 800 ms negative', () => {
    const { container } = render(() => <LatencyBars points={latencySeries([100, null, 900, 800, 250])} />)
    const bars = screen.getAllByTestId('observability-latency-bar')
    expect(bars).toHaveLength(4)
    const over = bars.filter((b) => b.getAttribute('data-over') === 'true')
    expect(over).toHaveLength(1)
    expect(over[0].getAttribute('class')).toContain('fill-negative')
    for (const b of bars.filter((x) => x !== over[0])) expect(b.getAttribute('class')).toContain('fill-brand')
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('900 ms')
    expectNoLiteralColours(container.innerHTML)
  })

  it('draws no bars and says so when every bucket is null', () => {
    render(() => <LatencyBars points={latencySeries([null, null])} />)
    expect(screen.queryAllByTestId('observability-latency-bar')).toHaveLength(0)
    expect(screen.getByRole('img').getAttribute('aria-label')).toContain('No latency data')
  })
})
