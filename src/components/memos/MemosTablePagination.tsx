import type { Accessor } from 'solid-js'
import { onMount, Show } from 'solid-js'
import useMemosCount from '@api/hooks/memos/useMemosCount'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
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
      <div class="flex items-center gap-3 flex-wrap my-3">
        <label class="flex items-center gap-2">
          <span class="text-muted-foreground text-sm">Rows</span>
          <select
            value={transactionsState.memosTableLimit}
            onChange={(e) => {
              const v = Number(e.currentTarget.value)
              setMemosTableLimit(v)
              clearMemosByOffset()
              updateMemosTableOffset(0)
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
          Page {currentPage()} / {totalPages()} ({effectiveTotal()} total)
        </span>
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={goNext}
          disabled={currentPage() >= totalPages()}
        >
          Next
        </Button>
      </div>
    </div>
  )
}
