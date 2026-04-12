import { DateTime } from 'luxon'
import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js'
import { getPeriodLabel } from '@api/helpers/formatPeriodLabels'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import useTransactions from '@api/hooks/transactions/useTransactions'
import { useQueryClient } from '@tanstack/solid-query'
import { budgetCategoryColorsFromData } from '@composables/budgetCategoryColors'
import mutateTransaction from '@api/hooks/transactions/mutateTransaction'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import AlertComponent from '@components/shared/AlertComponent'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import PeriodHeader from '@components/transactions/PeriodHeader'
import SummaryStatsCards from '@components/transactions/SummaryStatsCards'
import TransactionsTablePagination from '@components/transactions/TransactionsTablePagination'
import TransactionsTableSelects from '@components/transactions/TransactionsTableSelects'
import { transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'
import type { BudgetCategorySummary } from '@types'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Skeleton } from '@components/ui/skeleton'
import TransactionsTableChartsRow from '@components/transactions/TransactionsTableChartsRow'
import TransactionsTableRow from '@components/transactions/TransactionsTableRow'
import { getTransactionsTableSelectedValue } from '@components/transactions/transactionsTableSelectedValue'

export default function TransactionsTable() {
  const queryClient = useQueryClient()
  const query = useTransactions()
  const mutation = mutateTransaction()

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [categoryDialogTarget, setCategoryDialogTarget] = createSignal<import('@types').Transaction | null>(
    null,
  )
  const [mutatingTransactionId, setMutatingTransactionId] = createSignal<number | null>(null)
  const [categoryAssignError, setCategoryAssignError] = createSignal<string | null>(null)

  function openCategoryDialog(row: import('@types').Transaction) {
    setCategoryAssignError(null)
    setCategoryDialogTarget(row)
    setCategoryDialogOpen(true)
  }

  function handleCategorySelect(category: string) {
    const target = categoryDialogTarget()
    if (!target || target.id == null) return
    setCategoryAssignError(null)
    setMutatingTransactionId(target.id)
    mutation.mutate(
      { transaction: { id: target.id, budget_category: category } },
      {
        onSuccess: async () => {
          await invalidateAfterTransactionUpdate(queryClient, { transactionId: target.id })
          setMutatingTransactionId(null)
          setCategoryAssignError(null)
        },
        onError: (err) => {
          setMutatingTransactionId(null)
          const msg = err instanceof Error ? err.message : String(err)
          setCategoryAssignError(msg)
          setCategoryDialogOpen(true)
        },
      },
    )
  }

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

  const firstDay = createMemo(() => {
    const dates = flattenedData()
      .map((t) => t.date)
      .filter((d): d is string => Boolean(d && String(d).trim()))
      .sort()
    return dates[0]
  })

  const defaultMonthForCharts = createMemo(() => {
    if (transactionsState.selectedMonth) return transactionsState.selectedMonth
    const fd = firstDay()
    if (fd) {
      const dt = DateTime.fromISO(fd, { zone: 'utc' })
      if (dt.isValid) return dt.toFormat('MM-yyyy')
    }
    return DateTime.now().toFormat('MM-yyyy')
  })

  const chartTimeFrame = createMemo(() => {
    if (transactionsState.selectedDay) return Timeframe.Day
    if (transactionsState.selectedWeek) return Timeframe.Week
    if (transactionsState.selectedYear) return Timeframe.Year
    return Timeframe.Month
  })

  const chartDate = createMemo(() => {
    if (transactionsState.selectedDay) return transactionsState.selectedDay
    if (transactionsState.selectedWeek) return transactionsState.selectedWeek
    if (transactionsState.viewMode === 'year' && transactionsState.selectedYear)
      return transactionsState.selectedYear
    if (transactionsState.selectedMonth) return transactionsState.selectedMonth
    if (transactionsState.selectedYear) return transactionsState.selectedYear
    return defaultMonthForCharts()
  })

  const categorySummaryQuery = useBudgetCategorySummary(
    () => chartTimeFrame(),
    () => chartDate(),
  )

  const categoryColors = createMemo(() => {
    const data = categorySummaryQuery.data as BudgetCategorySummary[] | undefined
    return budgetCategoryColorsFromData(data)
  })

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

  return (
    <div class="space-y-6">
      <Show when={query.isError && query.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="transactions-table-error-alert"
          />
        )}
      </Show>

      <Show when={categoryAssignError()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Could not assign category"
            message={msg()}
            dataTestId="transactions-table-category-assign-error"
            close={() => setCategoryAssignError(null)}
          />
        )}
      </Show>

      <PeriodHeader />

      <SummaryStatsCards transactions={paginatedData()} />

      <TransactionsTableChartsRow
        firstDay={firstDay()}
        chartTimeFrame={chartTimeFrame()}
        chartDate={chartDate}
      />

      <TransactionsTableSelects dataTestId="transactions-table-selects" />

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <CardTitle>{cardTitle()}</CardTitle>
        </CardHeader>
        <CardContent>
          <Show when={isLoadingCondition()}>
            <div class="space-y-3">
              <For each={Array.from({ length: 6 })}>
                {() => (
                  <div class="flex items-center justify-between rounded-lg border border-border p-4">
                    <div class="flex items-center gap-4">
                      <Skeleton class="size-10 rounded-full" />
                      <div class="space-y-2">
                        <Skeleton class="h-4 w-[200px]" />
                        <Skeleton class="h-3 w-[140px]" />
                      </div>
                    </div>
                    <Skeleton class="h-4 w-[80px]" />
                  </div>
                )}
              </For>
            </div>
          </Show>

          <Show when={!isLoadingCondition() && paginatedData().length > 0}>
            <ul role="list" aria-label="Transactions" class="space-y-2" data-testid="transactions-table">
              <For each={paginatedData()}>
                {(row) => (
                  <TransactionsTableRow
                    row={row}
                    categoryColors={categoryColors}
                    mutatingTransactionId={mutatingTransactionId}
                    openCategoryDialog={openCategoryDialog}
                  />
                )}
              </For>
            </ul>
          </Show>

          <Show when={!isLoadingCondition() && paginatedData().length === 0}>
            <div class="py-8 text-center text-muted-foreground">No transactions for the current filters.</div>
          </Show>
        </CardContent>
      </Card>

      <TransactionsTablePagination />

      <CategoryTreeSelectDialog
        open={categoryDialogOpen()}
        onOpenChange={setCategoryDialogOpen}
        value={
          typeof categoryDialogTarget()?.budget_category === 'string'
            ? (categoryDialogTarget()!.budget_category as string)
            : ''
        }
        onSelect={handleCategorySelect}
        subtitle={categoryDialogTarget()?.memo || categoryDialogTarget()?.description || undefined}
      />
    </div>
  )
}
