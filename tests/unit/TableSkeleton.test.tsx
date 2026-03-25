import { render, screen } from '@solidjs/testing-library'
import { describe, expect, it } from 'vitest'
import TableSkeleton from '@components/shared/TableSkeleton'

describe('TableSkeleton', () => {
  const columns = [
    { prop: 'date', label: 'Date' },
    { prop: 'amount_debit', label: 'Amount' },
  ]

  it('renders column headers', () => {
    render(() => <TableSkeleton columns={columns} />)
    expect(screen.getByText('Date')).toBeInTheDocument()
    expect(screen.getByText('Amount')).toBeInTheDocument()
  })

  it('renders 10 skeleton rows by default', () => {
    const { container } = render(() => <TableSkeleton columns={columns} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(10)
  })

  it('renders custom number of rows', () => {
    const { container } = render(() => <TableSkeleton columns={columns} rows={3} />)
    const rows = container.querySelectorAll('tbody tr')
    expect(rows.length).toBe(3)
  })

  it('applies default data-testid', () => {
    render(() => <TableSkeleton columns={columns} />)
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument()
  })

  it('applies custom data-testid', () => {
    render(() => <TableSkeleton columns={columns} dataTestId="custom-skeleton" />)
    expect(screen.getByTestId('custom-skeleton')).toBeInTheDocument()
  })

  it('renders shimmer spans per cell', () => {
    const { container } = render(() => <TableSkeleton columns={columns} rows={1} />)
    const shimmers = container.querySelectorAll('.bv-shimmer')
    expect(shimmers.length).toBe(2) // one per column
  })
})
