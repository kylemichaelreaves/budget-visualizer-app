import { createEffect, createMemo, createRenderEffect, on } from 'solid-js'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import useTransactions from '@api/hooks/transactions/useTransactions'
import {
  takeAndApplyPendingTransactionsScrollRestore,
  transactionsState,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'
import { createTransactionsTableChartSlice } from '@components/transactions/table/createTransactionsTableChartSlice'
import { getTransactionsTableSelectedValue } from '@components/transactions/table/transactionsTableSelectedValue'

export function createTransactionsTableDerivedData() {
  const query = useTransactions()

  const LIMIT = () => transactionsState.transactionsTableLimit

  const flattenedData = createMemo(() => {
    const pages = query.data?.pages
    if (!pages) return []
    return pages
      .flat()
      .filter(
        (transaction) =>
          transaction.transaction_number && String(transaction.transaction_number).trim() !== '',
      )
  })

  const currentPage = () =>
    Math.floor(transactionsState.transactionsTableOffset / transactionsState.transactionsTableLimit) + 1

  const paginatedData = createMemo(() => {
    const start = (currentPage() - 1) * LIMIT()
    const end = start + LIMIT()
    return flattenedData().slice(start, end)
  })

  // eslint-disable-next-line solid/reactivity -- flattenedData is read inside createTransactionsTableChartSlice memos
  const chart = createTransactionsTableChartSlice(flattenedData)

  const isInitialLoading = () => query.isLoading || (query.isFetching && !query.data?.pages?.length)

  const isLoadingCondition = () =>
    isInitialLoading() || query.isFetchingNextPage || query.isFetchingPreviousPage

  async function loadMorePagesIfNeeded() {
    const requiredDataCount = currentPage() * LIMIT()
    while (flattenedData().length < requiredDataCount && query.hasNextPage) {
      await query.fetchNextPage()
    }
  }

  createEffect(
    on(
      () => currentPage(),
      () => {
        void loadMorePagesIfNeeded()
      },
    ),
  )

  /**
   * Clamp table pagination when the result set shrinks, and after a refetch restore pill scroll.
   * Clamp runs in this render effect first; scroll restore is queued so it runs after any offset-driven
   * DOM update (so the anchor row exists when we scrollIntoView).
   */
  createRenderEffect(
    on(
      () =>
        [
          query.isFetching,
          flattenedData().length,
          transactionsState.transactionsTableOffset,
          LIMIT(),
        ] as const,
      ([isFetching, len, offset, limit], prev) => {
        if (len > 0) {
          const maxPageIndex = Math.max(0, Math.ceil(len / limit) - 1)
          const maxOffset = maxPageIndex * limit
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
    paginatedData,
    firstDay: chart.firstDay,
    chartTimeFrame: chart.chartTimeFrame,
    chartDate: chart.chartDate,
    categoryColors: chart.categoryColors,
    isLoadingCondition,
    cardTitle,
  }
}
