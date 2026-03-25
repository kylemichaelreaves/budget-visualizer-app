import { onMount, Show } from 'solid-js'
import useTransactionsCount from '@api/hooks/transactions/useTransactionsCount'
import AlertComponent from '@components/shared/AlertComponent'
import {
  setTransactionsCount,
  setTransactionsTableLimit,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import type { PendingTransactionStatus } from '@types'

export default function TransactionsTablePagination(props: { status?: PendingTransactionStatus }) {
  const countQuery = useTransactionsCount(props.status !== undefined ? () => props.status : undefined)

  onMount(() => {
    void countQuery.refetch()
    updateTransactionsTableOffset(0)
    const d = countQuery.data
    if (d !== undefined) {
      setTransactionsCount(d)
    }
  })

  const currentPage = () =>
    Math.floor(transactionsState.transactionsTableOffset / transactionsState.transactionsTableLimit) + 1

  const totalPages = () =>
    Math.max(1, Math.ceil(Number(countQuery.data ?? 0) / transactionsState.transactionsTableLimit))

  function goPrev() {
    if (currentPage() > 1) {
      updateTransactionsTableOffset((currentPage() - 2) * transactionsState.transactionsTableLimit)
    }
  }

  function goNext() {
    if (currentPage() < totalPages()) {
      updateTransactionsTableOffset(currentPage() * transactionsState.transactionsTableLimit)
    }
  }

  return (
    <div data-testid="transactions-table-pagination">
      <Show when={countQuery.isError && countQuery.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="transactions-table-pagination-error"
          />
        )}
      </Show>
      <div
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '12px',
          'flex-wrap': 'wrap',
          margin: '12px 0',
        }}
      >
        <label style={{ display: 'flex', 'align-items': 'center', gap: '8px' }}>
          <span style={{ color: '#bdc3c7', 'font-size': '0.85rem' }}>Rows</span>
          <select
            value={transactionsState.transactionsTableLimit}
            onChange={(e) => {
              const v = Number(e.currentTarget.value)
              setTransactionsTableLimit(v)
              updateTransactionsTableOffset(0)
            }}
            style={{ padding: '6px', 'border-radius': '4px' }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <button type="button" onClick={goPrev} disabled={currentPage() <= 1}>
          Previous
        </button>
        <span style={{ color: '#ecf0f1' }}>
          Page {currentPage()} / {totalPages()} ({countQuery.data ?? 0} total)
        </span>
        <button type="button" onClick={goNext} disabled={currentPage() >= totalPages()}>
          Next
        </button>
      </div>
    </div>
  )
}
