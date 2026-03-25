import type { JSX } from 'solid-js'
import { For, Show, createMemo, createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import AlertComponent from '@components/shared/AlertComponent'
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
      style={{
        margin: '6px 0',
        'padding-left': `${pad()}px`,
        'list-style': 'none',
        'border-left': props.depth > 0 ? '1px solid #444' : 'none',
      }}
      data-testid={`budget-category-node-${props.depth}`}
    >
      <div
        style={{
          display: 'flex',
          'flex-wrap': 'wrap',
          gap: '10px',
          'align-items': 'baseline',
        }}
      >
        <span style={{ color: '#ecf0f1', 'font-weight': 600 }}>{props.node.label}</span>
        <code
          style={{
            'font-size': '0.8rem',
            color: '#95a5a6',
            'word-break': 'break-all',
          }}
          data-testid="budget-category-path"
        >
          {props.node.value}
        </code>
      </div>
      <Show when={children().length > 0}>
        <ul style={{ margin: '8px 0 0', padding: 0 }}>
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
    <div style={{ color: '#ecf0f1', 'max-width': '960px' }} data-testid="budget-categories-page">
      <header style={{ 'margin-bottom': '16px' }}>
        <h1 style={{ margin: '0 0 8px', 'font-size': '1.35rem' }}>Budget categories</h1>
        <p style={{ margin: 0, color: '#bdc3c7', 'font-size': '0.9rem' }}>
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

      <div
        style={{
          display: 'flex',
          'flex-wrap': 'wrap',
          gap: '12px',
          'align-items': 'center',
          margin: '12px 0',
        }}
      >
        <input
          type="search"
          placeholder="Filter by name or path…"
          value={filter()}
          onInput={(e) => setFilter(e.currentTarget.value)}
          disabled={q.isLoading || q.isFetching}
          aria-label="Filter categories"
          data-testid="budget-categories-filter"
          style={{
            flex: '1 1 220px',
            'min-width': '180px',
            padding: '10px 12px',
            'border-radius': '6px',
            border: '1px solid #555',
            background: '#1e1e1e',
            color: '#ecf0f1',
          }}
        />
        <button
          type="button"
          data-testid="budget-categories-refresh"
          disabled={q.isFetching}
          onClick={() => void queryClient.invalidateQueries({ queryKey: ['budgetCategories'] })}
        >
          {q.isFetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <Show when={q.isLoading}>
        <p style={{ color: '#95a5a6' }} data-testid="budget-categories-loading">
          Loading categories…
        </p>
      </Show>

      <Show when={!q.isLoading && visibleTree().length === 0}>
        <p style={{ color: '#95a5a6' }} data-testid="budget-categories-empty">
          {tree().length === 0 ? 'No categories returned from the API.' : 'No categories match your filter.'}
        </p>
      </Show>

      <Show when={!q.isLoading && visibleTree().length > 0}>
        <div
          style={{
            padding: '16px',
            background: '#2a2a2a',
            'border-radius': '8px',
            border: '1px solid #444',
          }}
          data-testid="budget-categories-tree"
        >
          <ul style={{ margin: 0, padding: 0 }}>
            <For each={visibleTree()}>{(n) => <TreeNode node={n} depth={0} />}</For>
          </ul>
        </div>
      </Show>
    </div>
  )
}
