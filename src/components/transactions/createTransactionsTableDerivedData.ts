import { createEffect, createMemo, on } from 'solid-js'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import useTransactions from '@api/hooks/transactions/useTransactions'
import { transactionsState } from '@stores/transactionsStore'
import { createTransactionsTableChartSlice } from '@components/transactions/createTransactionsTableChartSlice'
import { getTransactionsTableSelectedValue } from '@components/transactions/transactionsTableSelectedValue'

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
