import { fireEvent, render, screen } from '@solidjs/testing-library'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  setTransactionsTableLimit,
  transactionsState,
  updatePendingTableOffset,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'

const count = { data: 250 as number | undefined, error: null, refetch: vi.fn(async () => undefined) }
const countStatus = vi.fn()
vi.mock('@api/hooks/transactions/useTransactionsCount', () => ({
  default: (status?: () => unknown) => {
    countStatus(status?.())
    return count
  },
}))

const { default: TransactionsTablePagination } =
  await import('@components/transactions/table/TransactionsTablePagination')

const pager = () => screen.getByTestId('transactions-table-pagination')
const [prev, next] = [0, 1].map((i) => () => pager().querySelectorAll('button')[i]!)

describe('TransactionsTablePagination', () => {
  beforeEach(() => {
    setTransactionsTableLimit(100)
    updateTransactionsTableOffset(0)
    updatePendingTableOffset(0)
    countStatus.mockClear()
  })

  it('pages the main table by its own offset', () => {
    render(() => <TransactionsTablePagination />)
    expect(countStatus).toHaveBeenCalledWith(undefined)
    expect(pager()).toHaveTextContent('Page 1 / 3 (250 total)')
    expect(prev()).toBeDisabled()

    fireEvent.click(next())
    fireEvent.click(next())
    expect(transactionsState.transactionsTableOffset).toBe(200)
    expect(next()).toBeDisabled()
    fireEvent.click(prev())
    expect(transactionsState.transactionsTableOffset).toBe(100)
    expect(transactionsState.pendingTableOffset).toBe(0)
  })

  // The pending table used to share transactionsTableOffset with the main table.
  it('pages the pending table by pendingTableOffset, leaving the main table alone', () => {
    updateTransactionsTableOffset(100)
    render(() => <TransactionsTablePagination status="reviewed" />)
    expect(countStatus).toHaveBeenCalledWith('reviewed')
    fireEvent.click(next())
    expect(transactionsState.pendingTableOffset).toBe(100)
    expect(transactionsState.transactionsTableOffset).toBe(100)
  })

  it('returns to the first page when the page size changes', () => {
    render(() => <TransactionsTablePagination status="pending" />)
    fireEvent.click(next())
    fireEvent.change(pager().querySelector('select')!, { target: { value: '50' } })
    expect(transactionsState.transactionsTableLimit).toBe(50)
    expect(transactionsState.pendingTableOffset).toBe(0)
  })
})
