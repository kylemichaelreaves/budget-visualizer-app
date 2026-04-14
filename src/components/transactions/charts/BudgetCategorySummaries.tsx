import type { JSX } from 'solid-js'
import { createEffect, createSignal, Show } from 'solid-js'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { useHistoricalSummaryForBudgetCategory } from '@api/hooks/budgetCategories/useHistoricalSummaryForBudgetCategory'
import LineChart from '@charts/LineChart'
import type { BudgetCategorySummary, Timeframe } from '@types'
import AlertComponent from '@components/shared/AlertComponent'
import { Skeleton } from '@components/ui/skeleton'
import { setSelectedBudgetCategory } from '@stores/transactionsStore'
import BudgetCategoryPieChart from './BudgetCategoryPieChart'

export default function BudgetCategorySummaries(props: {
  timeFrame: Timeframe
  /** ISO date or app timeframe key (month/week string) */
  date: () => string
  dataTestId?: string
}): JSX.Element | null {
  const summaryQuery = useBudgetCategorySummary(
    () => props.timeFrame,
    () => props.date(),
  )
  const [selectedCategory, setSelectedCategory] = createSignal('')

  const rows = () => (summaryQuery.data ?? []) as BudgetCategorySummary[]

  createEffect(() => {
    const list = rows()
    const top = list.find((r) => r.parent_id === null && Math.abs(r.total_amount_debit) > 0)
    const name = top?.full_path || top?.budget_category || top?.category_name || ''
    if (name && !selectedCategory()) {
      setSelectedCategory(name)
    }
  })

  const historicalQuery = useHistoricalSummaryForBudgetCategory(
    selectedCategory,
    () => props.timeFrame,
    () => props.date(),
  )

  const id = () => props.dataTestId ?? 'budget-category-summaries'

  const enabled = () => {
    const d = props.date()
    return !!d && d.trim() !== ''
  }

  return (
    <Show when={enabled()}>
      <div data-testid={id()} class="grid gap-5 my-3 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
        <Show when={summaryQuery.isError && summaryQuery.error}>
          {(err) => (
            <AlertComponent
              type="error"
              title={(err() as Error).name}
              message={(err() as Error).message}
              dataTestId={`${id()}-summary-error`}
            />
          )}
        </Show>
        <BudgetCategoryPieChart
          data={rows()}
          isLoading={summaryQuery.isLoading || summaryQuery.isFetching}
          showLegend={false}
          dataTestId={`${id()}-pie`}
          onSliceClick={(cat) => {
            const n = cat.full_path || cat.budget_category || cat.category_name
            if (n) {
              setSelectedCategory(n)
              setSelectedBudgetCategory(n)
            }
          }}
        />
        <div class="min-w-0">
          <p class="text-foreground text-center mb-2 text-sm">Historical — {selectedCategory() || '—'}</p>
          <Show when={historicalQuery.isError && historicalQuery.error}>
            {(err) => (
              <AlertComponent
                type="error"
                title={(err() as Error).name}
                message={(err() as Error).message}
                dataTestId={`${id()}-historical-error`}
              />
            )}
          </Show>
          <Show
            when={!historicalQuery.isLoading && !historicalQuery.isFetching}
            fallback={
              <div class="flex flex-col gap-2 pt-2" data-testid={`${id()}-historical-skeleton`}>
                <Skeleton class="h-[240px] w-full rounded-lg" />
                <div class="flex justify-between px-2">
                  <Skeleton class="h-3 w-12" />
                  <Skeleton class="h-3 w-12" />
                  <Skeleton class="h-3 w-12" />
                  <Skeleton class="h-3 w-12" />
                </div>
              </div>
            }
          >
            <div>
              <LineChart
                summaries={historicalQuery.data ?? []}
                handleOnClickSelection={() => undefined}
                dataTestId={`${id()}-historical-line`}
                loading={false}
                stackedDateLabels
              />
            </div>
          </Show>
        </div>
      </div>
    </Show>
  )
}
