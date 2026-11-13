import { onMount } from 'solid-js'
import useTransactionsCount from '@api/hooks/transactions/useTransactionsCount'
import TablePaginationBar from '@components/shared/TablePaginationBar'
import {
  setTransactionsTableLimit,
  transactionsState,
  updatePendingTableOffset,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import type { PendingTransactionStatus } from '@types'

/**
 * Pager for the transactions table, or — given `status` — the pending table,
 * which keeps its own offset so paging one table doesn't move the other.
 */
export default function TransactionsTablePagination(props: { status?: PendingTransactionStatus }) {
  const countQuery = useTransactionsCount(() => props.status)

  const offset = () =>
    props.status ? transactionsState.pendingTableOffset : transactionsState.transactionsTableOffset
  const setOffset = (value: number) =>
    props.status ? updatePendingTableOffset(value) : updateTransactionsTableOffset(value)

  onMount(() => {
    void countQuery.refetch()
    setOffset(0)
  })

  const currentPage = () => Math.floor(offset() / transactionsState.transactionsTableLimit) + 1

  const totalPages = () =>
    Math.max(1, Math.ceil(Number(countQuery.data ?? 0) / transactionsState.transactionsTableLimit))

  function goPrev() {
    if (currentPage() > 1) {
      setOffset((currentPage() - 2) * transactionsState.transactionsTableLimit)
    }
  }

  function goNext() {
    if (currentPage() < totalPages()) {
      setOffset(currentPage() * transactionsState.transactionsTableLimit)
    }
  }

  return (
    <TablePaginationBar
      dataTestId="transactions-table-pagination"
      error={countQuery.error}
      errorTitle="Could not count transactions"
      errorTestId="transactions-table-pagination-error"
      pageSize={transactionsState.transactionsTableLimit}
      onPageSizeChange={(v) => {
        setTransactionsTableLimit(v)
        setOffset(0)
      }}
      currentPage={currentPage()}
      totalPages={totalPages()}
      totalCount={Number(countQuery.data ?? 0)}
      onPrev={goPrev}
      onNext={goNext}
      prevDisabled={currentPage() <= 1}
      nextDisabled={currentPage() >= totalPages()}
    />
  )
}
