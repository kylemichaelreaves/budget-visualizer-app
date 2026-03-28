import { onMount, Show } from 'solid-js'
import useTransactionsCount from '@api/hooks/transactions/useTransactionsCount'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
import {
  setTransactionsCount,
  setTransactionsTableLimit,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import type { PendingTransactionStatus } from '@types'

export default function TransactionsTablePagination(props: { status?: PendingTransactionStatus }) {
  const countQuery = useTransactionsCount(() => props.status)

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
      <div class="flex items-center gap-3 flex-wrap my-3">
        <label class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">Rows</span>
          <select
            value={transactionsState.transactionsTableLimit}
            onChange={(e) => {
              const v = Number(e.currentTarget.value)
              setTransactionsTableLimit(v)
              updateTransactionsTableOffset(0)
            }}
            class="p-1.5 rounded"
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </label>
        <Button variant="outline" size="sm" type="button" onClick={goPrev} disabled={currentPage() <= 1}>
          Previous
        </Button>
        <span class="text-foreground">
          Page {currentPage()} / {totalPages()} ({countQuery.data ?? 0} total)
        </span>
        <Button variant="outline" size="sm" type="button" onClick={goNext} disabled={currentPage() >= totalPages()}>
          Next
        </Button>
      </div>
    </div>
  )
}
