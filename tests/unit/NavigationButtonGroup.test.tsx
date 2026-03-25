import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import NavigationButtonGroup from '@components/shared/NavigationButtonGroup'

describe('NavigationButtonGroup', () => {
  const defaultProps = {
    label: 'Month',
    isFirst: false,
    isLast: false,
    goToPrevious: vi.fn(),
    goToNext: vi.fn(),
  }

  it('renders Previous and Next buttons with label', () => {
    render(() => <NavigationButtonGroup {...defaultProps} />)
    expect(screen.getByText('← Previous Month')).toBeInTheDocument()
    expect(screen.getByText('Next Month →')).toBeInTheDocument()
  })

  it('disables Previous button when isLast is true', () => {
    render(() => <NavigationButtonGroup {...defaultProps} isLast={true} />)
    expect(screen.getByText('← Previous Month')).toBeDisabled()
  })

  it('disables Next button when isFirst is true', () => {
    render(() => <NavigationButtonGroup {...defaultProps} isFirst={true} />)
    expect(screen.getByText('Next Month →')).toBeDisabled()
  })

  it('calls goToPrevious on Previous click', () => {
    const goToPrevious = vi.fn()
    render(() => <NavigationButtonGroup {...defaultProps} goToPrevious={goToPrevious} />)
    fireEvent.click(screen.getByText('← Previous Month'))
    expect(goToPrevious).toHaveBeenCalledOnce()
  })

  it('calls goToNext on Next click', () => {
    const goToNext = vi.fn()
    render(() => <NavigationButtonGroup {...defaultProps} goToNext={goToNext} />)
    fireEvent.click(screen.getByText('Next Month →'))
    expect(goToNext).toHaveBeenCalledOnce()
  })

  it('renders Reset button when reset prop is provided', () => {
    const reset = vi.fn()
    render(() => <NavigationButtonGroup {...defaultProps} reset={reset} />)
    const resetBtn = screen.getByText('✕ Reset Month')
    expect(resetBtn).toBeInTheDocument()
    fireEvent.click(resetBtn)
    expect(reset).toHaveBeenCalledOnce()
  })

  it('does not render Reset button when reset is not provided', () => {
    render(() => <NavigationButtonGroup {...defaultProps} />)
    expect(screen.queryByText(/Reset/)).not.toBeInTheDocument()
  })
})
