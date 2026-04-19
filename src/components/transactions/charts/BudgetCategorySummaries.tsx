import type { Accessor, JSX } from 'solid-js'
import { createEffect, createSignal, Show } from 'solid-js'
import type { BudgetCategoryColorHelpers } from '@composables/budgetCategoryColors'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import { useHistoricalSummaryForBudgetCategory } from '@api/hooks/budgetCategories/useHistoricalSummaryForBudgetCategory'
import LineChart from '@charts/LineChart'
import type { BudgetCategorySummary, Timeframe } from '@types'
import AlertComponent from '@components/shared/AlertComponent'
import { Skeleton } from '@components/ui/skeleton'
import { setSelectedBudgetCategory } from '@stores/transactionsStore'
import BudgetCategoryTreemap from './BudgetCategoryTreemap'

export default function BudgetCategorySummaries(props: {
  timeFrame: Timeframe
  /** ISO date or app timeframe key (month/week string) */
  date: () => string
  /** Same object as transaction row category pills for matching treemap colors. */
  categoryColors: Accessor<BudgetCategoryColorHelpers>
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
      <div
        data-testid={id()}
        class="grid h-full min-h-0 grid-cols-1 grid-rows-[minmax(0,1.35fr)_minmax(140px,auto)] gap-3 lg:grid-cols-2 lg:grid-rows-1"
      >
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
        <div class="min-h-0 min-w-0">
          <BudgetCategoryTreemap
            data={rows()}
            categoryColors={props.categoryColors}
            isLoading={summaryQuery.isLoading || summaryQuery.isFetching}
            timeFrame={props.timeFrame}
            date={props.date()}
            dataTestId={`${id()}-treemap`}
            onCellClick={(cat) => {
              const n = cat.full_path || cat.budget_category || cat.category_name
              if (n) {
                setSelectedCategory(n)
                setSelectedBudgetCategory(n)
              }
            }}
          />
        </div>
        <div class="flex min-h-0 min-w-0 flex-col border-t border-border pt-2 lg:border-t-0 lg:border-l lg:pl-3 lg:pt-0">
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
            when={historicalQuery.data && historicalQuery.data.length > 0}
            fallback={
              <Show
                when={
                  historicalQuery.isLoading || (historicalQuery.isFetching && !historicalQuery.data?.length)
                }
              >
                <div class="flex flex-col gap-2 pt-2" data-testid={`${id()}-historical-skeleton`}>
                  <Skeleton class="h-[240px] w-full rounded-lg" />
                  <div class="flex justify-between px-2">
                    <Skeleton class="h-3 w-12" />
                    <Skeleton class="h-3 w-12" />
                    <Skeleton class="h-3 w-12" />
                    <Skeleton class="h-3 w-12" />
                  </div>
                </div>
              </Show>
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
