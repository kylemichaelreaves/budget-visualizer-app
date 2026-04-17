import { onMount } from 'solid-js'
import useTransactionsCount from '@api/hooks/transactions/useTransactionsCount'
import TablePaginationBar from '@components/shared/TablePaginationBar'
import {
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
    <TablePaginationBar
      dataTestId="transactions-table-pagination"
      error={countQuery.error}
      errorTestId="transactions-table-pagination-error"
      pageSize={transactionsState.transactionsTableLimit}
      onPageSizeChange={(v) => {
        setTransactionsTableLimit(v)
        updateTransactionsTableOffset(0)
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
