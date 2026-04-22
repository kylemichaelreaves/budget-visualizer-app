import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import { useBudgetCategorySummary } from '@api/hooks/budgetCategories/useBudgetCategorySummary'
import AlertComponent from '@components/shared/AlertComponent'
import BudgetCategorySunburst from '@components/transactions/charts/BudgetCategorySunburst'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'
import { createBudgetCategorySummaryTimeframeFromStore } from '@composables/budgetCategorySummaryTimeframeFromStore'
import { setSelectedBudgetCategory } from '@stores/transactionsStore'
import type { BudgetCategorySummary, CategoryNode } from '@types'
import BudgetCategoryInlineAddForm from './BudgetCategoryInlineAddForm'
import BudgetCategoryTreeNode from './BudgetCategoryTreeNode'
import { FolderTreeIcon, PlusIcon, RefreshCwIcon } from '@shared/icons'
import { useBudgetCategoriesPage } from './useBudgetCategoriesPage'

export default function BudgetCategoriesPage(): JSX.Element {
  const state = useBudgetCategoriesPage()
  const { chartTimeFrame, chartDate } = createBudgetCategorySummaryTimeframeFromStore(() => undefined)
  const categorySpendQuery = useBudgetCategorySummary(
    () => chartTimeFrame(),
    () => chartDate(),
  )
  const spendRows = () => (categorySpendQuery.data ?? []) as BudgetCategorySummary[]
  const hasSpendForSunburst = () =>
    spendRows().some((r) => r.parent_id === null && Math.abs(r.total_amount_debit) > 0)
  const isChartPending = () => categorySpendQuery.isLoading || categorySpendQuery.isFetching
  // TanStack keeps stale data on error — gate on !isError so the error banner
  // doesn't render alongside a chart built from the previous successful fetch.
  const showChart = () => !categorySpendQuery.isError && (isChartPending() || hasSpendForSunburst())
  const showChartEmpty = () => !categorySpendQuery.isError && !isChartPending() && !hasSpendForSunburst()

  return (
    <div class="text-foreground max-w-[960px]" data-testid="budget-categories-page">
      <header class="mb-6">
        <h1 class="mb-1 text-2xl font-bold" data-testid="budget-categories-page-heading">
          Budget categories
        </h1>
        <p class="m-0 text-muted-foreground text-sm">
          Set spending limits and manage your category hierarchy
        </p>
      </header>

      <Show when={state.q.isError && state.q.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="budget-categories-error"
          />
        )}
      </Show>

      <Show when={state.error()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Operation failed"
            message={msg()}
            dataTestId="budget-categories-mutation-error"
          />
        )}
      </Show>

      <Card class="mb-6" data-testid="budget-categories-sunburst-card">
        <CardHeader>
          <CardTitle>Spending by category</CardTitle>
          <CardDescription>
            Same period and memo filters as the transactions view. Click a slice to set the category filter.
          </CardDescription>
        </CardHeader>
        <CardContent class="pb-4">
          <Show when={categorySpendQuery.isError && categorySpendQuery.error}>
            {(err) => (
              <AlertComponent
                type="error"
                title={(err() as Error).name}
                message={(err() as Error).message}
                dataTestId="budget-categories-spend-chart-error"
              />
            )}
          </Show>
          <Show when={showChartEmpty()}>
            <p
              class="text-muted-foreground py-6 text-center text-sm"
              data-testid="budget-categories-spend-chart-empty"
            >
              No categorised expenses for this period.
            </p>
          </Show>
          <Show when={showChart()}>
            <div class="mx-auto w-full max-w-[300px]">
              <BudgetCategorySunburst
                data={spendRows()}
                isLoading={isChartPending()}
                timeFrame={chartTimeFrame()}
                date={chartDate()}
                dataTestId="budget-categories-sunburst"
                showLegend={false}
                onSliceClick={(cat) => {
                  const n = cat.full_path || cat.budget_category || cat.category_name
                  if (n) setSelectedBudgetCategory(n)
                }}
              />
            </div>
          </Show>
        </CardContent>
      </Card>

      <Card data-testid="budget-categories-tree">
        <CardHeader>
          <div class="flex items-center gap-2">
            <FolderTreeIcon class="size-5 text-muted-foreground" />
            <CardTitle>Budget Categories</CardTitle>
          </div>
          <CardDescription>
            Edit the hierarchy used in the category selector. Hover over any row to rename, add children, or
            delete.
          </CardDescription>
          <CardAction>
            <div class="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={state.refreshCategories}
                disabled={state.q.isLoading || state.q.isFetching}
                data-testid="budget-categories-refresh"
              >
                <RefreshCwIcon class="size-3.5" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => state.setAddingRoot(true)}
                disabled={state.addingRoot()}
                data-testid="add-root-category-button"
              >
                <PlusIcon class="size-3.5" />
                Add Category
              </Button>
            </div>
          </CardAction>
        </CardHeader>

        <CardContent>
          <div class="mb-4">
            <Input
              type="search"
              placeholder="Filter by name or path..."
              value={state.filter()}
              onInput={(e) => state.setFilter(e.currentTarget.value)}
              disabled={state.q.isLoading || state.q.isFetching}
              aria-label="Filter categories"
              data-testid="budget-categories-filter"
            />
          </div>

          <Show when={state.q.isLoading}>
            <p class="text-muted-foreground text-sm py-4 text-center" data-testid="budget-categories-loading">
              Loading categories...
            </p>
          </Show>

          <Show when={state.addingRoot()}>
            <div class="mb-2">
              <BudgetCategoryInlineAddForm
                placeholder="New root category..."
                onSubmit={(name) => state.handleAddRoot(name)}
                onCancel={() => state.setAddingRoot(false)}
                data-testid="add-root-form"
              />
            </div>
          </Show>

          <Show when={!state.q.isLoading && state.visibleTree().length === 0}>
            <p class="text-muted-foreground text-sm py-4 text-center" data-testid="budget-categories-empty">
              {state.tree().length === 0
                ? 'No categories yet. Click "Add Category" to create one.'
                : 'No categories match your filter.'}
            </p>
          </Show>

          <Show when={!state.q.isLoading && state.visibleTree().length > 0}>
            <ul class="m-0 p-0">
              <For each={state.visibleTree()}>
                {(node: CategoryNode) => (
                  <BudgetCategoryTreeNode
                    node={node}
                    depth={0}
                    onMutate={state.handleMutate}
                    mutatingPaths={state.mutatingPaths()}
                  />
                )}
              </For>
            </ul>
          </Show>
        </CardContent>
      </Card>
    </div>
  )
}
