import { render, screen } from '@solidjs/testing-library'
import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import MemosTableAlerts from '@components/memos/table/MemosTableAlerts'
import TransactionsTableAlerts from '@components/transactions/table/TransactionsTableAlerts'
import MemoSummaryTransactionsCard from '@components/memos/summaries/MemoSummaryTransactionsCard'

// #91: each call site passes its query error to ApiErrorAlert with a title that
// names what failed, and only while the query is in error.

const serverError = new AxiosError('Request failed with status code 500', '500', undefined, undefined, {
  status: 500,
  statusText: 'Internal Server Error',
  data: { message: 'Database unavailable' },
  headers: {},
  config: { headers: new AxiosHeaders() },
})

describe('ApiErrorAlert call sites', () => {
  it.each([true, false])('MemosTableAlerts (isError=%s)', (isError) => {
    render(() => (
      <MemosTableAlerts
        queryIsError={() => isError}
        queryError={() => serverError}
        tableMutationError={() => null}
        onDismissMutationError={vi.fn()}
      />
    ))
    const alert = screen.queryByTestId('memos-table-error-alert')
    if (!isError) return expect(alert).toBeNull()
    expect(alert).toHaveTextContent('Could not load memos')
    expect(alert).toHaveTextContent('Database unavailable')
  })

  it.each([true, false])('TransactionsTableAlerts (isError=%s)', (isError) => {
    render(() => (
      <TransactionsTableAlerts
        queryIsError={() => isError}
        queryError={() => serverError}
        categoryAssignError={() => null}
        onDismissCategoryError={vi.fn()}
        splitSaveError={() => null}
        onDismissSplitSaveError={vi.fn()}
      />
    ))
    const alert = screen.queryByTestId('transactions-table-error-alert')
    if (!isError) return expect(alert).toBeNull()
    expect(alert).toHaveTextContent('Could not load transactions')
    expect(alert).toHaveTextContent('Database unavailable')
  })

  it('MemoSummaryTransactionsCard', () => {
    render(() => (
      <MemoSummaryTransactionsCard
        txIsError={() => true}
        txError={() => serverError}
        txIsLoading={() => false}
        txIsFetching={() => false}
        txRows={() => []}
        summaryTransactionsCount={() => 0}
        txLimit={() => 50}
        setTxLimit={vi.fn()}
        txOffset={() => 0}
        setTxOffset={vi.fn()}
        canPrev={() => false}
        canNext={() => false}
        goPrevTx={vi.fn()}
        goNextTx={vi.fn()}
      />
    ))
    const alert = screen.getByTestId('memo-summary-tx-error')
    expect(alert).toHaveTextContent('Could not load transactions')
    expect(alert).toHaveTextContent('Database unavailable')
  })
})
