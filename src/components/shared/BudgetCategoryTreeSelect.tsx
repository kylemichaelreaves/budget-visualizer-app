import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import { Input } from '@components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'
import type { CategoryNode } from '@types'

interface FlatNode {
  node: CategoryNode
  breadcrumb: string[]
}

function flatten(nodes: CategoryNode[], ancestors: string[] = []): FlatNode[] {
  return nodes.flatMap((n) => [
    { node: n, breadcrumb: ancestors },
    ...flatten(n.children ?? [], [...ancestors, n.label]),
  ])
}

/** Flatten the tree respecting which nodes are currently expanded. */
function flattenVisible(nodes: CategoryNode[], expanded: Set<string>, ancestors: string[] = []): FlatNode[] {
  return nodes.flatMap((n) => {
    const self: FlatNode = { node: n, breadcrumb: ancestors }
    if ((n.children?.length ?? 0) > 0 && expanded.has(n.value)) {
      return [self, ...flattenVisible(n.children!, expanded, [...ancestors, n.label])]
    }
    return [self]
  })
}

export default function BudgetCategoryTreeSelect(props: {
  open: Accessor<boolean>
  onOpenChange: (open: boolean) => void
  value: string | null
  onSelect: (value: string) => void
  title?: string
  description?: string
}): JSX.Element {
  const q = useBudgetCategories()
  const [search, setSearch] = createSignal('')
  const [expanded, setExpanded] = createSignal<Set<string>>(new Set())
  const [focusedIndex, setFocusedIndex] = createSignal(-1)

  const treeData = createMemo(() => {
    const raw = q.data as unknown
    const data = extractBudgetCategoriesData(raw)
    if (!data) return []
    const tree = convertToTree(data)
    if (expanded().size === 0 && tree.length > 0) {
      setExpanded(new Set(tree.map((n) => n.value)))
    }
    return tree
  })

  const allFlat = createMemo(() => flatten(treeData()))

  const searchResults = createMemo(() => {
    const s = search().trim().toLowerCase()
    if (!s) return null
    return allFlat().filter(({ node }) => node.label.toLowerCase().includes(s))
  })

  /** The list of items currently visible — used for keyboard nav. */
  const visibleItems = createMemo((): FlatNode[] => {
    const sr = searchResults()
    if (sr !== null) return sr
    return flattenVisible(treeData(), expanded())
  })

  // Reset focused index when visible items change
  createEffect(
    on(visibleItems, () => {
      setFocusedIndex(-1)
    }),
  )

  // Reset focused index when dialog opens
  createEffect(
    on(props.open, (open) => {
      if (open) setFocusedIndex(-1)
    }),
  )

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSelect(value: string) {
    console.log('[TreeSelect] handleSelect:', value)
    props.onSelect(value)
    props.onOpenChange(false)
    setSearch('')
  }

  function handleOpenChange(open: boolean) {
    props.onOpenChange(open)
    if (!open) setSearch('')
  }

  function handleKeyDown(e: KeyboardEvent) {
    const items = visibleItems()
    if (items.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex((i) => (i < items.length - 1 ? i + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex((i) => (i > 0 ? i - 1 : items.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const idx = focusedIndex()
      if (idx >= 0 && idx < items.length) {
        const item = items[idx]
        const hasChildren = (item.node.children?.length ?? 0) > 0
        if (hasChildren) toggleExpand(item.node.value)
        handleSelect(item.node.value)
      }
    }
  }

  return (
    <Dialog open={props.open()} onOpenChange={handleOpenChange}>
      <DialogContent class="max-w-xs p-0 overflow-hidden" data-testid="category-tree-select-dialog">
        <div onKeyDown={handleKeyDown}>
          <DialogHeader class="px-4 pt-4 pb-0">
            <DialogTitle>{props.title ?? 'Select Category'}</DialogTitle>
            <Show when={props.description}>
              <p class="text-sm text-muted-foreground mt-1">{props.description}</p>
            </Show>
          </DialogHeader>

          <div class="px-4 pt-3 pb-2">
            <div class="relative">
              <svg
                class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <Input
                autofocus
                class="h-8 pl-8 text-sm"
                placeholder="Search categories…"
                value={search()}
                onInput={(e) => setSearch(e.currentTarget.value)}
                data-testid="category-tree-search"
              />
            </div>
          </div>

          <div class="px-2 pb-3 max-h-72 overflow-y-auto space-y-0.5" role="listbox">
            <Show when={q.isLoading || q.isFetching}>
              <p class="text-sm text-muted-foreground text-center py-6">Loading categories...</p>
            </Show>

            <Show when={!q.isLoading && !q.isFetching}>
              <Show
                when={searchResults() === null}
                fallback={
                  <Show
                    when={(searchResults()?.length ?? 0) > 0}
                    fallback={
                      <p class="text-sm text-muted-foreground text-center py-6">No categories found</p>
                    }
                  >
                    <For each={searchResults()!}>
                      {({ node, breadcrumb }, i) => {
                        // eslint-disable-next-line no-unassigned-vars -- assigned via JSX ref
                        let ref: HTMLButtonElement | undefined

                        createEffect(
                          on(
                            () => focusedIndex() === i(),
                            (f) => {
                              if (f) ref?.scrollIntoView({ block: 'nearest' })
                            },
                          ),
                        )

                        return (
                          <button
                            ref={ref}
                            onClick={() => handleSelect(node.value)}
                            role="option"
                            aria-selected={props.value === node.value}
                            class={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent ${
                              focusedIndex() === i() ? 'bg-accent' : ''
                            } ${props.value === node.value ? 'bg-primary/10 text-primary font-medium' : ''}`}
                            tabIndex={-1}
                          >
                            <Show when={breadcrumb.length > 0}>
                              <span class="text-xs text-muted-foreground">
                                {breadcrumb.join(' > ')} {'> '}
                              </span>
                            </Show>
                            {node.label}
                            <Show when={props.value === node.value}>
                              <svg
                                class="h-3.5 w-3.5 inline ml-1.5 text-primary"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            </Show>
                          </button>
                        )
                      }}
                    </For>
                  </Show>
                }
              >
                {/* Tree view — we render via visibleItems for keyboard nav */}
                <For each={visibleItems()}>
                  {(item, i) => {
                    const depth = () => item.breadcrumb.length

                    // eslint-disable-next-line no-unassigned-vars -- assigned via JSX ref
                    let ref: HTMLButtonElement | undefined

                    createEffect(
                      on(
                        () => focusedIndex() === i(),
                        (f) => {
                          if (f) ref?.scrollIntoView({ block: 'nearest' })
                        },
                      ),
                    )

                    const hasChildren = () => (item.node.children?.length ?? 0) > 0
                    const isOpen = () => expanded().has(item.node.value)
                    const isSelected = () => props.value === item.node.value

                    return (
                      <button
                        ref={ref}
                        style={{ 'padding-left': `${depth() * 18 + 10}px` }}
                        onClick={() => {
                          if (hasChildren()) toggleExpand(item.node.value)
                          handleSelect(item.node.value)
                        }}
                        role="option"
                        aria-selected={isSelected()}
                        class={`w-full flex items-center gap-2 py-1.5 pr-3 rounded-md text-sm transition-colors hover:bg-accent text-left ${
                          focusedIndex() === i() ? 'bg-accent' : ''
                        } ${isSelected() ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                        tabIndex={-1}
                      >
                        <span class="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
                          {hasChildren() ? (
                            isOpen() ? (
                              <svg
                                class="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path d="M6 9l6 6 6-6" />
                              </svg>
                            ) : (
                              <svg
                                class="h-3.5 w-3.5"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                              >
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            )
                          ) : (
                            <span class="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mx-auto" />
                          )}
                        </span>
                        <span class="flex-1 truncate">{item.node.label}</span>
                        <Show when={isSelected()}>
                          <svg
                            class="h-3.5 w-3.5 shrink-0 text-primary"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </Show>
                      </button>
                    )
                  }}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
