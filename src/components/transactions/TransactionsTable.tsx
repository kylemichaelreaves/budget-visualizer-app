import { A } from '@solidjs/router'
import { DateTime } from 'luxon'
import { createEffect, createMemo, For, on, Show } from 'solid-js'
import { formatDate } from '@api/helpers/formatDate'
import useTransactions from '@api/hooks/transactions/useTransactions'
import AlertComponent from '@components/shared/AlertComponent'
import TableSkeleton from '@components/shared/TableSkeleton'
import BudgetCategorySummaries from '@components/transactions/charts/BudgetCategorySummaries'
import DailyIntervalLineChart from '@components/transactions/charts/DailyIntervalLineChart/DailyIntervalLineChart'
import MonthSummaryTable from '@components/transactions/MonthSummaryTable'
import TransactionsTablePagination from '@components/transactions/TransactionsTablePagination'
import TransactionsTableSelects from '@components/transactions/TransactionsTableSelects'
import WeekSummaryTable from '@components/transactions/WeekSummaryTable'
import { clearTransactionsByOffset, transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'
import { devConsole } from '@utils/devConsole'

const transactionColumns = [
  { prop: 'id' as const, label: 'ID' },
  { prop: 'transaction_number' as const, label: 'Transaction Number' },
  { prop: 'date' as const, label: 'Date' },
  { prop: 'description' as const, label: 'Description' },
  { prop: 'memo_id' as const, label: 'Memo ID' },
  { prop: 'memo' as const, label: 'Memo' },
  { prop: 'amount_debit' as const, label: 'Amount Debit' },
  { prop: 'amount_credit' as const, label: 'Amount Credit' },
  { prop: 'balance' as const, label: 'Balance' },
  { prop: 'budget_category' as const, label: 'Budget Category' },
]

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
    <>
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

      <TransactionsTableSelects dataTestId="transactions-table-selects" />

      <Show when={transactionsState.selectedMonth}>
        <MonthSummaryTable />
        <BudgetCategorySummaries
          timeFrame={Timeframe.Month}
          date={() => transactionsState.selectedMonth}
          dataTestId="transactions-month-budget-summaries"
        />
      </Show>

      <Show when={transactionsState.selectedWeek}>
        <WeekSummaryTable />
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
        <DailyIntervalLineChart dataTestId="transactions-daily-interval-chart" firstDay={firstDay()} />
        <BudgetCategorySummaries
          timeFrame={Timeframe.Month}
          date={defaultMonthForCharts}
          dataTestId="transactions-default-budget-summaries"
        />
      </Show>

      <Show when={isLoadingCondition()}>
        <TableSkeleton columns={transactionColumns} rows={LIMIT()} dataTestId="transactions-table-skeleton" />
      </Show>

      <Show when={!isLoadingCondition() && paginatedData().length > 0}>
        <div onContextMenu={(e) => e.preventDefault()}>
          <table
            data-testid="transactions-table"
            aria-label="Transactions Table"
            style={{
              width: '100%',
              'border-collapse': 'collapse',
              'font-size': '0.85rem',
              color: '#ecf0f1',
            }}
          >
            <thead>
              <tr style={{ 'text-align': 'left', 'border-bottom': '1px solid #555' }}>
                {transactionColumns.map((col) => (
                  <th style={{ padding: '8px 6px' }} data-testid={`column-${col.prop}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <For each={paginatedData()}>
                {(row) => (
                  <tr
                    style={{ 'border-bottom': '1px solid #444' }}
                    onContextMenu={() => devConsole('log', 'context menu', row.id)}
                  >
                    <For each={transactionColumns}>
                      {(col) => (
                        <td style={{ padding: '8px 6px' }} data-testid={`cell-${col.prop}`}>
                          <Show
                            when={col.prop === 'id' && row.id != null}
                            fallback={
                              <Show
                                when={col.prop === 'date'}
                                fallback={
                                  <Show
                                    when={col.prop === 'memo_id' && row.memo_id != null}
                                    fallback={String((row as Record<string, unknown>)[col.prop] ?? '')}
                                  >
                                    <A
                                      href={`/budget-visualizer/memos/${row.memo_id}/summary`}
                                      data-testid="memo-link"
                                    >
                                      {String(row.memo_id)}
                                    </A>
                                  </Show>
                                }
                              >
                                <div data-testid={`date-cell-${row.date}`}>
                                  {formatDate(String(row.date))}
                                </div>
                              </Show>
                            }
                          >
                            <A
                              href={`/budget-visualizer/transactions/${row.id}/edit`}
                              data-testid={`transaction-link-${row.id}`}
                            >
                              {String(row.id)}
                            </A>
                          </Show>
                        </td>
                      )}
                    </For>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

      <Show when={!isLoadingCondition() && paginatedData().length === 0}>
        <p style={{ color: '#95a5a6' }}>No transactions for the current filters.</p>
      </Show>

      <Show when={!isPaginationDisabled()}>
        <TransactionsTablePagination />
      </Show>
    </>
  )
}
