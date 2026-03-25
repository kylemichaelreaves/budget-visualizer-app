import { onMount, Show } from 'solid-js'
import useMemosCount from '@api/hooks/memos/useMemosCount'
import AlertComponent from '@components/shared/AlertComponent'
import {
  clearMemosByOffset,
  setMemosCount,
  setMemosTableLimit,
  transactionsState,
  updateMemosTableOffset,
} from '@stores/transactionsStore'

export default function MemosTablePagination() {
  const countQuery = useMemosCount()

  onMount(() => {
    void countQuery.refetch()
    updateMemosTableOffset(0)
    const d = countQuery.data
    if (d !== undefined) {
      setMemosCount(d)
    }
  })

  const currentPage = () =>
    Math.floor(transactionsState.memosTableOffset / transactionsState.memosTableLimit) + 1

  const totalPages = () =>
    Math.max(1, Math.ceil(Number(countQuery.data ?? 0) / transactionsState.memosTableLimit))

  function goPrev() {
    if (currentPage() > 1) {
      updateMemosTableOffset((currentPage() - 2) * transactionsState.memosTableLimit)
    }
  }

  function goNext() {
    if (currentPage() < totalPages()) {
      updateMemosTableOffset(currentPage() * transactionsState.memosTableLimit)
    }
  }

  return (
    <div data-testid="memos-table-pagination">
      <Show when={countQuery.isError && countQuery.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="memos-table-pagination-error"
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
            value={transactionsState.memosTableLimit}
            onChange={(e) => {
              const v = Number(e.currentTarget.value)
              setMemosTableLimit(v)
              clearMemosByOffset()
              updateMemosTableOffset(0)
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
