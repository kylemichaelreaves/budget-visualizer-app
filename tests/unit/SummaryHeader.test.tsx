import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import SummaryHeader from '@components/shared/SummaryHeader'

describe('SummaryHeader', () => {
  const defaultProps = {
    timeFrame: 'Month' as const,
    selectedPeriod: '03-2024',
    isFirst: false,
    isLast: false,
    goToNext: vi.fn(),
    goToPrevious: vi.fn(),
    reset: vi.fn(),
  }

  it('renders title with timeframe and period', () => {
    render(() => <SummaryHeader {...defaultProps} />)
    expect(screen.getByTestId('month-summary-title')).toHaveTextContent('Month Summary for: 03-2024')
  })

  it('sets data-testid based on timeframe', () => {
    render(() => <SummaryHeader {...defaultProps} />)
    expect(screen.getByTestId('month-summary-header')).toBeInTheDocument()
  })

  it('uses week-based testids for Week timeframe', () => {
    render(() => <SummaryHeader {...defaultProps} timeFrame="Week" selectedPeriod="10-2024" />)
    expect(screen.getByTestId('week-summary-header')).toBeInTheDocument()
    expect(screen.getByTestId('week-summary-title')).toHaveTextContent('Week Summary for: 10-2024')
  })

  it('renders navigation buttons', () => {
    render(() => <SummaryHeader {...defaultProps} />)
    expect(screen.getByText('← Previous Month')).toBeInTheDocument()
    expect(screen.getByText('Next Month →')).toBeInTheDocument()
  })

  it('passes navigation callbacks through', () => {
    const goToNext = vi.fn()
    const goToPrevious = vi.fn()
    render(() => <SummaryHeader {...defaultProps} goToNext={goToNext} goToPrevious={goToPrevious} />)
    fireEvent.click(screen.getByText('Next Month →'))
    expect(goToNext).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByText('← Previous Month'))
    expect(goToPrevious).toHaveBeenCalledOnce()
  })

  it('renders subtitle when provided', () => {
    render(() => <SummaryHeader {...defaultProps} subtitle={<span data-testid="sub">Extra info</span>} />)
    expect(screen.getByTestId('sub')).toHaveTextContent('Extra info')
  })
})
