import { createEffect, createMemo, createRenderEffect, on } from 'solid-js'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import useSumAmountDebitByDate from '@api/hooks/transactions/useSumAmountDebitByDate'
import useTransactions from '@api/hooks/transactions/useTransactions'
import { fetchInfinitePagesUntilCount } from '@composables/infiniteQueryPagePrefetch'
import {
  takeAndApplyPendingTransactionsScrollRestore,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import { createTransactionsTableChartSlice } from '@components/transactions/table/createTransactionsTableChartSlice'
import { getTransactionsTableSelectedValue } from '@components/transactions/table/transactionsTableSelectedValue'
import {
  maxOffsetForLoadedPages,
  rowsForPage,
} from '@components/transactions/table/transactionsTablePageWindow'

export function createTransactionsTableDerivedData() {
  const query = useTransactions()

  const LIMIT = () => transactionsState.transactionsTableLimit

  /** Pages exactly as the server returned them, in offset order. */
  const loadedPages = createMemo(() => query.data?.pages ?? [])

  const currentPage = () =>
    Math.floor(transactionsState.transactionsTableOffset / transactionsState.transactionsTableLimit) + 1

  /**
   * The rows the server returned for this page's offset.
   *
   * Deliberately **not** a client-side re-slice of every loaded row. The older
   * approach flattened all pages, dropped some rows, then sliced by page index —
   * while `TransactionsTablePagination` took `totalPages` from the server's
   * unfiltered count. Two sources of truth for "how many rows are there", so every
   * dropped row shifted the later page boundaries and could leave a trailing page
   * empty. Rendering the page the server actually returned keeps the rows and the
   * count derived from the same query.
   *
   * The old `transaction_number` filter went with it: the column is `NOT NULL` in
   * the schema and the importer deletes legacy rows where it was null, so the
   * filter guarded a state that can no longer occur. Nothing keys on the field —
   * it is only shown as a fallback label when `description` is empty.
   */
  const paginatedData = createMemo(() => rowsForPage(loadedPages(), currentPage()))

  /**
   * Every loaded row. The summary cards and chart slice describe the whole fetched
   * window rather than a single page, so they keep using this.
   */
  const flattenedData = createMemo(() => loadedPages().flat())

  // eslint-disable-next-line solid/reactivity -- flattenedData is read inside createTransactionsTableChartSlice memos
  const chart = createTransactionsTableChartSlice(flattenedData)

  // Server-side debit total for the selected period, so the Total Debits card reflects the
  // whole result set rather than only the rows on the current page. Falls back (undefined)
  // to the client-side sum in SummaryStatsCards until the aggregate resolves.
  const sumDebitQuery = useSumAmountDebitByDate(chart.chartTimeFrame, chart.chartDate)
  const debitTotal = () => sumDebitQuery.data?.[0]?.total_amount_debit

  const isInitialLoading = () => query.isLoading || (query.isFetching && !query.data?.pages?.length)

  const isLoadingCondition = () =>
    isInitialLoading() || query.isFetchingNextPage || query.isFetchingPreviousPage

  /**
   * The query only appends, so reaching page N means pages 1..N must be fetched.
   * Counted in pages, not rows — row counts are what let the rendered window drift
   * from the page index in the first place.
   */
  createEffect(
    on(currentPage, () => {
      void fetchInfinitePagesUntilCount(query, {
        currentCount: () => loadedPages().length,
        requiredCount: currentPage(),
      })
    }),
  )

  /**
   * Clamp pagination when the offset points past the end of the result set, and
   * after a refetch restore pill scroll.
   *
   * Clamping waits for the window to settle (`!isFetching && !hasNextPage`).
   * Acting mid-prefetch would measure the offset against pages that have not
   * arrived yet and bounce the user back. Scroll restore is queued so it runs after
   * any offset-driven DOM update, so the anchor row exists when we scrollIntoView.
   */
  createRenderEffect(
    on(
      () =>
        [
          query.isFetching,
          loadedPages(),
          transactionsState.transactionsTableOffset,
          LIMIT(),
          query.hasNextPage,
        ] as const,
      ([isFetching, pages, offset, limit, hasNextPage], prev) => {
        if (!isFetching && !hasNextPage && pages.length > 0) {
          const maxOffset = maxOffsetForLoadedPages(pages, limit)
          if (offset > maxOffset) {
            updateTransactionsTableOffset(maxOffset)
          }
        }
        const wasFetching = prev?.[0]
        if (wasFetching === true && isFetching === false) {
          queueMicrotask(() => {
            takeAndApplyPendingTransactionsScrollRestore()
          })
        }
      },
    ),
  )

  const cardTitle = () => {
    if (!transactionsState.viewMode) return 'Recent Transactions'
    if (transactionsState.viewMode === 'memo') return `Results for "${transactionsState.selectedMemo}"`
    return getPeriodLabel(transactionsState.viewMode, getTransactionsTableSelectedValue())
  }

  return {
    query,
    flattenedData,
    paginatedData,
    firstDay: chart.firstDay,
    chartTimeFrame: chart.chartTimeFrame,
    chartDate: chart.chartDate,
    categoryColors: chart.categoryColors,
    debitTotal,
    isLoadingCondition,
    cardTitle,
  }
}
