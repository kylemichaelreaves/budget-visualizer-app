import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import AlertComponent from '@components/shared/AlertComponent'

describe('AlertComponent', () => {
  it('renders title and message with role alert', () => {
    render(() => (
      <AlertComponent type="error" title="Failed" message="Something went wrong" dataTestId="x-alert" />
    ))
    const el = screen.getByTestId('x-alert')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('role', 'alert')
    expect(screen.getByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders dismiss button when close callback is provided', () => {
    const close = vi.fn()
    render(() => <AlertComponent type="warning" title="Heads up" message="Check this" close={close} />)
    const btn = screen.getByLabelText('Dismiss')
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(close).toHaveBeenCalledOnce()
  })

  it('does not render dismiss button when close is not provided', () => {
    render(() => <AlertComponent type="info" title="Note" message="FYI" />)
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument()
  })

  it('uses default data-testid when not specified', () => {
    render(() => <AlertComponent type="success" title="Done" message="All good" />)
    expect(screen.getByTestId('alert')).toBeInTheDocument()
  })
})
