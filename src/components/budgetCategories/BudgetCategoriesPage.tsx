import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { BUDGET_CATEGORY_PATH_DELIMITER, convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card'
import type { CategoryNode } from '@types'
import BudgetCategoryInlineAddForm from './BudgetCategoryInlineAddForm'
import BudgetCategoryTreeNode from './BudgetCategoryTreeNode'
import { FolderTreeIcon, PlusIcon, RefreshCwIcon } from '@shared/icons'
import { mutateBudgetCategory, type BudgetCategoryOperation } from './mutateBudgetCategory'
import { filterTree } from './budgetCategoryTreeUtils'

export default function BudgetCategoriesPage(): JSX.Element {
  const q = useBudgetCategories(
    () => undefined,
    () => undefined,
    false,
  )
  const queryClient = useQueryClient()

  const [filter, setFilter] = createSignal('')
  const [addingRoot, setAddingRoot] = createSignal(false)
  const [mutatingPaths, setMutatingPaths] = createSignal<Set<string>>(new Set())
  const [error, setError] = createSignal<string | null>(null)

  const tree = createMemo(() => {
    const raw = q.data as unknown
    const data = extractBudgetCategoriesData(raw)
    if (!data || typeof data !== 'object') return [] as CategoryNode[]
    return convertToTree(data)
  })

  const visibleTree = createMemo(() => filterTree(tree(), filter()))

  const handleMutate = async (op: BudgetCategoryOperation) => {
    const pathKey = op.path.join(BUDGET_CATEGORY_PATH_DELIMITER)

    setError(null)
    setMutatingPaths((prev) => {
      const next = new Set(prev)
      next.add(pathKey)
      return next
    })

    try {
      await mutateBudgetCategory(op)
      await queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(`Failed to ${op.operation} category: ${message}`)
    } finally {
      setMutatingPaths((prev) => {
        const next = new Set(prev)
        next.delete(pathKey)
        return next
      })
    }
  }

  const handleAddRoot = async (name: string) => {
    await handleMutate({ operation: 'add', path: [], name })
    setAddingRoot(false)
  }

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

      <Show when={q.isError && q.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="budget-categories-error"
          />
        )}
      </Show>

      <Show when={error()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Operation failed"
            message={msg()}
            dataTestId="budget-categories-mutation-error"
          />
        )}
      </Show>

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
                onClick={() =>
                  void queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategories.all })
                }
                disabled={q.isLoading || q.isFetching}
                data-testid="budget-categories-refresh"
              >
                <RefreshCwIcon class="size-3.5" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingRoot(true)}
                disabled={addingRoot()}
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
              value={filter()}
              onInput={(e) => setFilter(e.currentTarget.value)}
              disabled={q.isLoading || q.isFetching}
              aria-label="Filter categories"
              data-testid="budget-categories-filter"
            />
          </div>

          <Show when={q.isLoading}>
            <p class="text-muted-foreground text-sm py-4 text-center" data-testid="budget-categories-loading">
              Loading categories...
            </p>
          </Show>

          <Show when={addingRoot()}>
            <div class="mb-2">
              <BudgetCategoryInlineAddForm
                placeholder="New root category..."
                onSubmit={(name) => handleAddRoot(name)}
                onCancel={() => setAddingRoot(false)}
                data-testid="add-root-form"
              />
            </div>
          </Show>

          <Show when={!q.isLoading && visibleTree().length === 0}>
            <p class="text-muted-foreground text-sm py-4 text-center" data-testid="budget-categories-empty">
              {tree().length === 0
                ? 'No categories yet. Click "Add Category" to create one.'
                : 'No categories match your filter.'}
            </p>
          </Show>

          <Show when={!q.isLoading && visibleTree().length > 0}>
            <ul class="m-0 p-0">
              <For each={visibleTree()}>
                {(node) => (
                  <BudgetCategoryTreeNode
                    node={node}
                    depth={0}
                    onMutate={handleMutate}
                    mutatingPaths={mutatingPaths()}
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
