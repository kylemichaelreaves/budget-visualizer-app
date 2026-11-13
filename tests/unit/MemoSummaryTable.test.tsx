import { fireEvent, render, screen } from '@solidjs/testing-library'
import { describe, expect, it, vi } from 'vitest'

// The page is composition over `useMemoSummaryTable`; this pins the error wiring (#91):
// the save error is dismissible, and load errors carry a title naming what failed.

const dismissPatchError = vi.fn()
const state = {
  invalidId: () => false,
  patchError: () => 'Unknown budget category' as string | null,
  dismissPatchError,
  memoQ: { isError: true, error: new Error('memo 404') },
  summaryQ: { isError: true, error: new Error('summary 500'), data: undefined },
  txQ: { isError: false, error: null, isLoading: false, isFetching: false, data: [] },
  params: { memoId: '7' },
  memo: () => undefined,
}
vi.mock('@components/memos/summaries/useMemoSummaryTable', () => ({ useMemoSummaryTable: () => state }))
vi.mock('@components/memos/summaries/MemoSummaryHeader', () => ({ default: () => null }))
vi.mock('@components/memos/summaries/MemoSummaryStatCards', () => ({ default: () => null }))
vi.mock('@components/memos/summaries/MemoSummaryTransactionsCard', () => ({ default: () => null }))
vi.mock('@components/transactions/CategoryTreeSelectDialog', () => ({ default: () => null }))

const { default: MemoSummaryTable } = await import('@components/memos/summaries/MemoSummaryTable')

describe('MemoSummaryTable error wiring', () => {
  it('shows a dismissible save error and titled load errors', () => {
    render(() => <MemoSummaryTable />)

    const patch = screen.getByTestId('memo-summary-patch-error')
    expect(patch).toHaveTextContent('Could not save changes')
    expect(patch).toHaveTextContent('Unknown budget category')
    fireEvent.click(screen.getByRole('button', { name: /close|dismiss/i }))
    expect(dismissPatchError).toHaveBeenCalledOnce()

    expect(screen.getByTestId('memo-summary-memo-error')).toHaveTextContent('Could not load memo')
    expect(screen.getByTestId('memo-summary-memo-error')).toHaveTextContent('memo 404')
    expect(screen.getByTestId('memo-summary-stats-error')).toHaveTextContent('Could not load memo summary')
    expect(screen.getByTestId('memo-summary-stats-error')).toHaveTextContent('summary 500')
  })
})
