import { render, screen, fireEvent } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'
import TablePaginationBar from '@components/shared/TablePaginationBar'

function baseProps(overrides: Partial<Parameters<typeof TablePaginationBar>[0]> = {}) {
  return {
    dataTestId: 'bar',
    pageSize: 25,
    onPageSizeChange: vi.fn(),
    currentPage: 1,
    totalPages: 4,
    totalCount: 100,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    prevDisabled: false,
    nextDisabled: false,
    ...overrides,
  }
}

describe('TablePaginationBar', () => {
  it('renders page indicator with totals', () => {
    render(() => <TablePaginationBar {...baseProps({ currentPage: 2, totalPages: 4, totalCount: 100 })} />)
    expect(screen.getByText(/Page 2 \/ 4 \(100 total\)/)).toBeInTheDocument()
  })

  it('disables prev/next per props and wires click handlers', () => {
    const onPrev = vi.fn()
    const onNext = vi.fn()
    render(() => (
      <TablePaginationBar {...baseProps({ onPrev, onNext, prevDisabled: true, nextDisabled: false })} />
    ))
    const prev = screen.getByRole('button', { name: 'Previous' })
    const next = screen.getByRole('button', { name: 'Next' })
    expect(prev).toBeDisabled()
    expect(next).not.toBeDisabled()
    fireEvent.click(next)
    expect(onNext).toHaveBeenCalledOnce()
    expect(onPrev).not.toHaveBeenCalled()
  })

  it('calls onPageSizeChange with the new numeric size', () => {
    const onPageSizeChange = vi.fn()
    render(() => <TablePaginationBar {...baseProps({ onPageSizeChange })} />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    fireEvent.change(select, { target: { value: '50' } })
    expect(onPageSizeChange).toHaveBeenCalledWith(50)
  })

  it('renders custom pageSizeOptions when provided', () => {
    render(() => <TablePaginationBar {...baseProps({ pageSize: 10, pageSizeOptions: [10, 20] })} />)
    expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: '25' })).not.toBeInTheDocument()
  })

  it('injects current pageSize into options when it is not already listed', () => {
    render(() => <TablePaginationBar {...baseProps({ pageSize: 75, pageSizeOptions: [10, 20] })} />)
    // 75 should be added (sorted) so the controlled <select value={75}> matches an <option>.
    expect(screen.getByRole('option', { name: '75' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '10' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: '20' })).toBeInTheDocument()
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('75')
  })

  it('defaults errorTestId to `${dataTestId}-error` when not provided', () => {
    render(() => <TablePaginationBar {...baseProps({ error: new Error('x'), dataTestId: 'memos-pg' })} />)
    expect(screen.getByTestId('memos-pg-error')).toBeInTheDocument()
  })

  it('renders nothing for error when not provided', () => {
    render(() => <TablePaginationBar {...baseProps({ errorTestId: 'bar-err' })} />)
    expect(screen.queryByTestId('bar-err')).not.toBeInTheDocument()
  })

  it('renders Error instances with their name and message', () => {
    const err = new TypeError('boom')
    render(() => <TablePaginationBar {...baseProps({ error: err, errorTestId: 'bar-err' })} />)
    const alert = screen.getByTestId('bar-err')
    expect(alert).toBeInTheDocument()
    expect(alert.textContent).toContain('TypeError')
    expect(alert.textContent).toContain('boom')
  })

  it('normalizes non-Error thrown values into a renderable alert', () => {
    render(() => <TablePaginationBar {...baseProps({ error: 'network fail', errorTestId: 'bar-err' })} />)
    const alert = screen.getByTestId('bar-err')
    expect(alert).toBeInTheDocument()
    expect(alert.textContent).toContain('network fail')
  })
})
