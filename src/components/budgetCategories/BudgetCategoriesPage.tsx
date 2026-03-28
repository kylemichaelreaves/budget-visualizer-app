import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Card, CardContent } from '@components/ui/card'
import type { CategoryNode } from '@types'

function filterTree(nodes: CategoryNode[], q: string): CategoryNode[] {
  const needle = q.trim().toLowerCase()
  if (!needle) return nodes

  function keep(n: CategoryNode): CategoryNode | null {
    const selfMatch = n.label.toLowerCase().includes(needle) || n.value.toLowerCase().includes(needle)
    const kids = n.children?.map(keep).filter((x): x is CategoryNode => x != null) ?? []
    if (selfMatch) {
      return { ...n, children: n.children }
    }
    if (kids.length > 0) {
      return { ...n, children: kids }
    }
    return null
  }

  return nodes.map(keep).filter((x): x is CategoryNode => x != null)
}

function TreeNode(props: { node: CategoryNode; depth: number }): JSX.Element {
  const children = () => props.node.children ?? []
  const pad = () => Math.min(props.depth, 12) * 14

  return (
    <li
      class="my-1.5 list-none"
      style={{ 'padding-left': `${pad()}px` }}
      classList={{ 'border-l border-border': props.depth > 0 }}
      data-testid={`budget-category-node-${props.depth}`}
    >
      <div class="flex flex-wrap gap-2.5 items-baseline">
        <span class="text-foreground font-semibold">{props.node.label}</span>
        <code
          class="text-xs text-muted-foreground break-all"
          data-testid="budget-category-path"
        >
          {props.node.value}
        </code>
      </div>
      <Show when={children().length > 0}>
        <ul class="mt-2 m-0 p-0">
          <For each={children()}>{(c) => <TreeNode node={c} depth={props.depth + 1} />}</For>
        </ul>
      </Show>
    </li>
  )
}

export default function BudgetCategoriesPage(): JSX.Element {
  const q = useBudgetCategories(
    () => undefined,
    () => undefined,
    false,
  )
  const queryClient = useQueryClient()
  const [filter, setFilter] = createSignal('')

  const tree = createMemo(() => {
    const raw = q.data as unknown
    const data = extractBudgetCategoriesData(raw)
    if (!data || typeof data !== 'object') return [] as CategoryNode[]
    return convertToTree(data)
  })

  const visibleTree = createMemo(() => filterTree(tree(), filter()))

  return (
    <div class="text-foreground max-w-[960px]" data-testid="budget-categories-page">
      <header class="mb-4">
        <h1 class="mb-2 text-xl">Budget categories</h1>
        <p class="m-0 text-muted-foreground text-sm">
          Hierarchy from the API (read-only). Use this path string when assigning categories on transactions
          and memos.
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

      <div class="flex flex-wrap gap-3 items-center my-3">
        <Input
          type="search"
          placeholder="Filter by name or path..."
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
          disabled={q.isLoading || q.isFetching}
          aria-label="Filter categories"
          data-testid="budget-categories-filter"
          class="flex-[1_1_220px] min-w-[180px]"
        />
        <Button
          variant="outline"
          type="button"
          data-testid="budget-categories-refresh"
          disabled={q.isFetching}
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['budgetCategories'] })}
        >
          {q.isFetching ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Show when={q.isLoading}>
        <p class="text-muted-foreground" data-testid="budget-categories-loading">
          Loading categories...
        </p>
      </Show>

      <Show when={!q.isLoading && visibleTree().length === 0}>
        <p class="text-muted-foreground" data-testid="budget-categories-empty">
          {tree().length === 0 ? 'No categories returned from the API.' : 'No categories match your filter.'}
        </p>
      </Show>

      <Show when={!q.isLoading && visibleTree().length > 0}>
        <Card data-testid="budget-categories-tree">
          <CardContent class="pt-4">
            <ul class="m-0 p-0">
              <For each={visibleTree()}>{(n) => <TreeNode node={n} depth={0} />}</For>
            </ul>
          </CardContent>
        </Card>
      </Show>
    </div>
  )
}
