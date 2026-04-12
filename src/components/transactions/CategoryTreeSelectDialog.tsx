import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, Show } from 'solid-js'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import type { CategoryNode } from '@types'
import { Input } from '@components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'

function flattenWithBreadcrumb(
  nodes: CategoryNode[],
  ancestors: string[] = [],
): { node: CategoryNode; breadcrumb: string[] }[] {
  return nodes.flatMap((n) => [
    { node: n, breadcrumb: ancestors },
    ...(n.children ? flattenWithBreadcrumb(n.children, [...ancestors, n.label]) : []),
  ])
}

function TreeNodeRow(props: {
  node: CategoryNode
  depth: number
  selected: string
  expanded: Set<string>
  highlighted: number
  /** O(1) keyboard row index by category value (rebuilt when `navigableItems` changes). */
  treeNavIndexByValue: Accessor<Map<string, number>>
  onToggle: (value: string) => void
  onSelect: (value: string) => void
  onHighlight: (index: number) => void
}): JSX.Element {
  const hasChildren = () => (props.node.children?.length ?? 0) > 0
  const isOpen = () => props.expanded.has(props.node.value)
  const isSelected = () => props.selected === props.node.value
  const navIndex = () => props.treeNavIndexByValue().get(props.node.value) ?? -1
  const isHighlighted = () => props.highlighted === navIndex()

  return (
    <>
      <div
        data-highlight={isHighlighted()}
        style={{ 'padding-left': `${props.depth * 18 + 10}px` }}
        onMouseEnter={() => props.onHighlight(navIndex())}
        class={`w-full flex items-center gap-1 py-1.5 pr-3 rounded-md text-sm transition-colors ${
          isHighlighted()
            ? 'bg-accent text-accent-foreground'
            : isSelected()
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-foreground'
        }`}
      >
        <Show when={hasChildren()} fallback={<span class="shrink-0 w-7 h-7" aria-hidden="true" />}>
          <button
            type="button"
            aria-expanded={isOpen()}
            aria-label={isOpen() ? 'Collapse category' : 'Expand category'}
            class="shrink-0 size-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation()
              props.onToggle(props.node.value)
            }}
          >
            <Show
              when={isOpen()}
              fallback={
                <svg
                  class="size-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              }
            >
              <svg
                class="size-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Show>
          </button>
        </Show>
        <button
          type="button"
          role="option"
          aria-selected={isSelected()}
          class="flex-1 min-w-0 flex items-center gap-2 py-0.5 text-left rounded-md"
          onClick={() => props.onSelect(props.node.value)}
        >
          <span class="flex-1 truncate">{props.node.label}</span>
          <Show when={isSelected()}>
            <svg
              class="size-3.5 shrink-0 text-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </Show>
        </button>
      </div>

      <Show when={hasChildren() && isOpen()}>
        <For each={props.node.children!}>
          {(child) => (
            <TreeNodeRow
              node={child}
              depth={props.depth + 1}
              selected={props.selected}
              expanded={props.expanded}
              highlighted={props.highlighted}
              treeNavIndexByValue={props.treeNavIndexByValue}
              onToggle={props.onToggle}
              onSelect={props.onSelect}
              onHighlight={props.onHighlight}
            />
          )}
        </For>
      </Show>
    </>
  )
}

/** Collect visible nodes from the tree respecting expand state */
function getVisibleNodes(nodes: CategoryNode[], expanded: Set<string>): CategoryNode[] {
  const out: CategoryNode[] = []
  for (const n of nodes) {
    out.push(n)
    if (n.children?.length && expanded.has(n.value)) {
      out.push(...getVisibleNodes(n.children, expanded))
    }
  }
  return out
}

export default function CategoryTreeSelectDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSelect: (value: string) => void
  title?: string
  subtitle?: string
}): JSX.Element {
  const [search, setSearch] = createSignal('')
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  const [highlight, setHighlight] = createSignal(0)

  let listRef: HTMLDivElement | undefined

  const q = useBudgetCategories(
    () => undefined,
    () => undefined,
    false,
    () => props.open,
  )

  const tree = createMemo(() => {
    const raw = q.data as unknown
    const categoryData = extractBudgetCategoriesData(raw)
    if (!categoryData || typeof categoryData !== 'object') return [] as CategoryNode[]
    return convertToTree(categoryData)
  })

  // Auto-expand top-level nodes when data first loads
  createEffect(() => {
    const nodes = tree()
    if (nodes.length > 0 && expanded().size === 0) {
      setExpanded(new Set(nodes.map((n) => n.value)))
    }
  })

  const allFlat = createMemo(() => flattenWithBreadcrumb(tree()))

  const searchResults = createMemo(() => {
    const query = search().trim().toLowerCase()
    if (!query) return null
    return allFlat().filter(({ node }) => node.label.toLowerCase().includes(query))
  })

  // Flat list of navigable items for keyboard
  const navigableItems = createMemo(() => {
    const results = searchResults()
    if (results !== null) {
      return results.map(({ node }) => node)
    }
    return getVisibleNodes(tree(), expanded())
  })

  const treeNavIndexByValue = createMemo(() => {
    const items = navigableItems()
    const m = new Map<string, number>()
    for (let i = 0; i < items.length; i++) {
      m.set(items[i].value, i)
    }
    return m
  })

  // Reset highlight when the list changes
  createEffect(() => {
    navigableItems()
    setHighlight(0)
  })

  function scrollHighlightIntoView() {
    if (!listRef) return
    const el = listRef.querySelector(`[data-highlight="true"]`)
    if (el) el.scrollIntoView({ block: 'nearest' })
  }

  function toggleExpand(value: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  function handleSelect(value: string) {
    props.onSelect(value)
    props.onOpenChange(false)
    setSearch('')
  }

  function handleKeyDown(e: KeyboardEvent) {
    const items = navigableItems()
    if (!items.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((i) => Math.min(i + 1, items.length - 1))
      queueMicrotask(scrollHighlightIntoView)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((i) => Math.max(i - 1, 0))
      queueMicrotask(scrollHighlightIntoView)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = items[highlight()]
      if (!item) return
      handleSelect(item.value)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      props.onOpenChange(false)
      setSearch('')
    }
  }

  return (
    <Dialog
      open={props.open}
      onOpenChange={(v) => {
        props.onOpenChange(v)
        if (!v) setSearch('')
      }}
    >
      <DialogContent class="max-w-xs p-0 overflow-hidden" data-testid="category-tree-select-dialog">
        <DialogHeader class="px-4 pt-4 pb-0">
          <DialogTitle>{props.title ?? 'Assign Budget Category'}</DialogTitle>
          <Show when={props.subtitle}>
            <p class="text-sm text-muted-foreground truncate m-0">{props.subtitle}</p>
          </Show>
        </DialogHeader>

        <div class="px-4 pt-3 pb-2">
          <div class="relative">
            <svg
              class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <Input
              autofocus
              class="h-8 pl-8 text-sm"
              placeholder="Search categories..."
              data-testid="category-tree-search"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
        </div>

        <div class="px-2 pb-3 max-h-72 overflow-y-auto space-y-0.5" ref={(el) => (listRef = el)}>
          <Show when={q.isLoading || q.isFetching}>
            <p class="text-sm text-muted-foreground text-center py-6">Loading categories...</p>
          </Show>

          <Show when={!q.isLoading && !q.isFetching}>
            <Show
              when={searchResults() === null}
              fallback={
                <Show
                  when={searchResults()!.length > 0}
                  fallback={<p class="text-sm text-muted-foreground text-center py-6">No categories found</p>}
                >
                  <For each={searchResults()!}>
                    {({ node, breadcrumb }, index) => (
                      <button
                        type="button"
                        role="option"
                        aria-selected={props.value === node.value}
                        onClick={() => handleSelect(node.value)}
                        onMouseEnter={() => setHighlight(index())}
                        data-highlight={highlight() === index()}
                        class={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                          highlight() === index()
                            ? 'bg-accent text-accent-foreground'
                            : props.value === node.value
                              ? 'bg-primary/10 text-primary font-medium'
                              : ''
                        }`}
                      >
                        <Show when={breadcrumb.length > 0}>
                          <span class="text-xs text-muted-foreground">
                            {breadcrumb.join(' \u203A ')} {'\u203A'}{' '}
                          </span>
                        </Show>
                        {node.label}
                        <Show when={props.value === node.value}>
                          <svg
                            class="size-3.5 inline ml-1.5 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </Show>
                      </button>
                    )}
                  </For>
                </Show>
              }
            >
              <For each={tree()}>
                {(node) => (
                  <TreeNodeRow
                    node={node}
                    depth={0}
                    selected={props.value}
                    expanded={expanded()}
                    highlighted={highlight()}
                    treeNavIndexByValue={treeNavIndexByValue}
                    onToggle={toggleExpand}
                    onSelect={handleSelect}
                    onHighlight={setHighlight}
                  />
                )}
              </For>
            </Show>
          </Show>
        </div>
      </DialogContent>
    </Dialog>
  )
}
