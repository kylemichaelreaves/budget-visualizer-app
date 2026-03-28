import { A } from '@solidjs/router'
import { DateTime } from 'luxon'
import { createEffect, createMemo, For, on, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import useTransactions from '@api/hooks/transactions/useTransactions'
import AlertComponent from '@components/shared/AlertComponent'
import BudgetCategorySummaries from '@components/transactions/charts/BudgetCategorySummaries'
import DailyIntervalLineChart from '@components/transactions/charts/DailyIntervalLineChart/DailyIntervalLineChart'
import MonthSummaryTable from '@components/transactions/MonthSummaryTable'
import TransactionsTablePagination from '@components/transactions/TransactionsTablePagination'
import TransactionsTableSelects from '@components/transactions/TransactionsTableSelects'
import WeekSummaryTable from '@components/transactions/WeekSummaryTable'
import { clearTransactionsByOffset, transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'
import { devConsole } from '@utils/devConsole'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Badge } from '@components/ui/badge'
import { Skeleton } from '@components/ui/skeleton'

function formatCurrency(value: unknown): string {
  const num = Number(value)
  if (!Number.isFinite(num) || value == null || value === '') return ''
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
}

export default function TransactionsTable() {
  const query = useTransactions()

  const isPaginationDisabled = () =>
    Boolean(
      transactionsState.selectedDay || transactionsState.selectedWeek || transactionsState.selectedMonth,
    )

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

  const isLoadingCondition = () =>
    query.isLoading ||
    query.isFetching ||
    query.isRefetching ||
    query.isFetchingNextPage ||
    query.isFetchingPreviousPage

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

  let skipSelectionRefetch = true
  createEffect(
    on(
      () =>
        [
          transactionsState.selectedDay,
          transactionsState.selectedWeek,
          transactionsState.selectedMonth,
          transactionsState.selectedYear,
          transactionsState.selectedMemo,
        ] as const,
      () => {
        if (skipSelectionRefetch) {
          skipSelectionRefetch = false
          return
        }
        devConsole('log', '[TransactionsTable] selection changed, refetch')
        clearTransactionsByOffset()
        void query.refetch()
      },
    ),
  )

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

      {/* Charts row */}
      <div class="grid gap-6 md:grid-cols-2">
        <Card class="gap-0 justify-between">
          <CardHeader class="pt-3 pb-0 px-4">
            <CardTitle>Transaction History</CardTitle>
          </CardHeader>
          <CardContent class="px-3 pb-0 mt-auto">
            <DailyIntervalLineChart dataTestId="transactions-daily-interval-chart" firstDay={firstDay()} />
          </CardContent>
        </Card>

        <Card class="gap-0 justify-between">
          <CardHeader class="pt-3 pb-0 px-4">
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent class="px-3 pb-0 mt-auto">
            <Show when={transactionsState.selectedMonth}>
              <BudgetCategorySummaries
                timeFrame={Timeframe.Month}
                date={() => transactionsState.selectedMonth}
                dataTestId="transactions-month-budget-summaries"
              />
            </Show>
            <Show when={transactionsState.selectedWeek}>
              <BudgetCategorySummaries
                timeFrame={Timeframe.Week}
                date={() => transactionsState.selectedWeek}
                dataTestId="transactions-week-budget-summaries"
              />
            </Show>
            <Show when={transactionsState.selectedDay}>
              <BudgetCategorySummaries
                timeFrame={Timeframe.Day}
                date={() => transactionsState.selectedDay}
                dataTestId="transactions-day-budget-summaries"
              />
            </Show>
            <Show
              when={
                !transactionsState.selectedDay &&
                !transactionsState.selectedWeek &&
                !transactionsState.selectedMonth
              }
            >
              <BudgetCategorySummaries
                timeFrame={Timeframe.Month}
                date={defaultMonthForCharts}
                dataTestId="transactions-default-budget-summaries"
              />
            </Show>
          </CardContent>
        </Card>
      </div>

      <Show when={transactionsState.selectedMonth}>
        <MonthSummaryTable />
      </Show>

      <Show when={transactionsState.selectedWeek}>
        <WeekSummaryTable />
      </Show>

      <TransactionsTableSelects dataTestId="transactions-table-selects" />

      {/* Transactions list */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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
            <div class="space-y-2" data-testid="transactions-table">
              <For each={paginatedData()}>
                {(row) => {
                  const debit = Number(row.amount_debit)
                  const credit = Number(row.amount_credit)
                  const hasDebit = Number.isFinite(debit) && debit !== 0
                  const hasCredit = Number.isFinite(credit) && credit !== 0
                  const isCredit = hasCredit && !hasDebit

                  return (
                    <div
                      class="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                      onContextMenu={() => devConsole('log', 'context menu', row.id)}
                    >
                      <div class="flex items-center gap-4 min-w-0">
                        <div
                          class={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                            isCredit ? 'bg-green-950' : 'bg-red-950'
                          }`}
                        >
                          <Show
                            when={isCredit}
                            fallback={
                              <svg
                                class="size-4 text-red-500"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                              >
                                <polyline points="22 17 13.5 8.5 8.5 13.5 2 7" />
                                <polyline points="16 17 22 17 22 11" />
                              </svg>
                            }
                          >
                            <svg
                              class="size-4 text-green-500"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            >
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                              <polyline points="16 7 22 7 22 13" />
                            </svg>
                          </Show>
                        </div>

                        <div class="min-w-0">
                          <p class="font-medium truncate">
                            <A
                              href={`/budget-visualizer/transactions/${row.id}/edit`}
                              class="hover:underline"
                              data-testid={`transaction-link-${row.id}`}
                            >
                              {row.description || `Transaction #${row.transaction_number}`}
                            </A>
                          </p>
                          <p class="text-sm text-muted-foreground truncate">
                            <Show
                              when={row.memo && row.memo_id != null}
                              fallback={
                                row.memo ? (
                                  <>
                                    {String(row.memo)}
                                    {' · '}
                                  </>
                                ) : null
                              }
                            >
                              <A
                                href={`/budget-visualizer/memos/${row.memo_id}/summary`}
                                class="hover:underline"
                                data-testid="memo-link"
                              >
                                {String(row.memo)}
                              </A>
                              {' · '}
                            </Show>
                            {formatDate(String(row.date))}
                            <Show when={row.budget_category}>
                              {' · '}
                              <Badge variant="outline" class="ml-1 text-xs">
                                {Array.isArray(row.budget_category)
                                  ? `Split (${row.budget_category.length})`
                                  : String(row.budget_category)}
                              </Badge>
                            </Show>
                          </p>
                        </div>
                      </div>

                      <div class="flex items-center gap-4 shrink-0">
                        <Show when={hasDebit}>
                          <span class="font-semibold text-red-500">{formatCurrency(row.amount_debit)}</span>
                        </Show>
                        <Show when={hasCredit}>
                          <span class="font-semibold text-green-500">
                            +{formatCurrency(row.amount_credit)}
                          </span>
                        </Show>
                        <Show when={row.balance != null}>
                          <span class="text-sm text-muted-foreground">
                            Bal: {formatCurrency(row.balance)}
                          </span>
                        </Show>
                      </div>
                    </div>
                  )
                }}
              </For>
            </div>
          </Show>

          <Show when={!isLoadingCondition() && paginatedData().length === 0}>
            <div class="py-8 text-center text-muted-foreground">No transactions for the current filters.</div>
          </Show>
        </CardContent>
      </Card>

      <Show when={!isPaginationDisabled()}>
        <TransactionsTablePagination />
      </Show>
    </div>
  )
}
