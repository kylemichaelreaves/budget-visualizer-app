import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import TimeframeToggle from '@components/shared/TimeframeToggle'

describe('TimeframeToggle', () => {
  it('renders default options (Weekly, Monthly, Yearly)', () => {
    render(() => <TimeframeToggle value="weekly" onChange={() => {}} />)
    expect(screen.getByText('Weekly')).toBeInTheDocument()
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })

  it('renders custom options when provided', () => {
    const options = [
      { label: 'Day', value: 'day' },
      { label: 'Hour', value: 'hour' },
    ]
    render(() => <TimeframeToggle value="day" onChange={() => {}} options={options} />)
    expect(screen.getByText('Day')).toBeInTheDocument()
    expect(screen.getByText('Hour')).toBeInTheDocument()
    expect(screen.queryByText('Weekly')).not.toBeInTheDocument()
  })

  it('calls onChange when a different option is clicked', () => {
    const onChange = vi.fn()
    render(() => <TimeframeToggle value="weekly" onChange={onChange} />)
    fireEvent.click(screen.getByText('Monthly'))
    expect(onChange).toHaveBeenCalledWith('monthly')
  })

  it('does not call onChange when the active option is clicked', () => {
    const onChange = vi.fn()
    render(() => <TimeframeToggle value="weekly" onChange={onChange} />)
    fireEvent.click(screen.getByText('Weekly'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('applies active styling to the selected option', () => {
    render(() => <TimeframeToggle value="monthly" onChange={() => {}} />)
    expect(screen.getByText('Monthly').classList.contains('bg-primary')).toBe(true)
    expect(screen.getByText('Weekly').classList.contains('bg-primary')).toBe(false)
  })
})
