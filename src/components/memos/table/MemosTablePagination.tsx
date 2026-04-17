import type { Accessor } from 'solid-js'
import { onMount } from 'solid-js'
import useMemosCount from '@api/hooks/memos/useMemosCount'
import TablePaginationBar from '@components/shared/TablePaginationBar'
import {
  clearMemosByOffset,
  setMemosCount,
  setMemosTableLimit,
  transactionsState,
  updateMemosTableOffset,
} from '@stores/transactionsStore'

export default function MemosTablePagination(
  props: {
    /** When set (e.g. client-side search), drives page count instead of the server memos total */
    clientFilteredTotal?: Accessor<number | undefined>
  } = {},
) {
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

  const effectiveTotal = () => {
    const override = props.clientFilteredTotal?.()
    if (override !== undefined) return override
    return Number(countQuery.data ?? 0)
  }

  const totalPages = () => Math.max(1, Math.ceil(effectiveTotal() / transactionsState.memosTableLimit))

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
    <TablePaginationBar
      dataTestId="memos-table-pagination"
      error={countQuery.error}
      errorTestId="memos-table-pagination-error"
      pageSize={transactionsState.memosTableLimit}
      onPageSizeChange={(v) => {
        setMemosTableLimit(v)
        clearMemosByOffset()
        updateMemosTableOffset(0)
      }}
      currentPage={currentPage()}
      totalPages={totalPages()}
      totalCount={effectiveTotal()}
      onPrev={goPrev}
      onNext={goNext}
      prevDisabled={currentPage() <= 1}
      nextDisabled={currentPage() >= totalPages()}
      prevTestId="memos-table-pagination-prev"
      nextTestId="memos-table-pagination-next"
    />
  )
}
