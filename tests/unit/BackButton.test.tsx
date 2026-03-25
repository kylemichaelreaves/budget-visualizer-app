import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import BackButton from '@components/shared/BackButton'

describe('BackButton', () => {
  it('renders with "Go Back" text', () => {
    render(() => <BackButton />)
    expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
  })

  it('calls window.history.back on click', () => {
    const spy = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    render(() => <BackButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Go Back' }))
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('applies data-test-id when provided', () => {
    render(() => <BackButton dataTestId="custom-back" />)
    const btn = screen.getByRole('button', { name: 'Go Back' })
    expect(btn.getAttribute('data-test-id')).toBe('custom-back')
  })
})
