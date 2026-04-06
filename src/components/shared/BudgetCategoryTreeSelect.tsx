import type { Accessor, JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, Show } from 'solid-js'
import { extractBudgetCategoriesData } from '@api/helpers/extractBudgetCategoriesData'
import { convertToTree } from '@api/helpers/convertToTree'
import { useBudgetCategories } from '@api/hooks/budgetCategories/useBudgetCategories'
import { Input } from '@components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'
import { SearchIcon } from './CategoryTreeIcons'
import { flatten, flattenVisible } from './categoryTreeUtils'
import type { FlatNode } from './categoryTreeUtils'
import CategorySearchResult from './CategorySearchResult'
import CategoryTreeNode from './CategoryTreeNode'

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

  const visibleItems = createMemo((): FlatNode[] => {
    const sr = searchResults()
    if (sr !== null) return sr
    return flattenVisible(treeData(), expanded())
  })

  createEffect(
    on(visibleItems, () => {
      setFocusedIndex(-1)
    }),
  )

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
              <SearchIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
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
                      {({ node, breadcrumb }, i) => (
                        <CategorySearchResult
                          label={node.label}
                          value={node.value}
                          breadcrumb={breadcrumb}
                          selected={props.value === node.value}
                          focused={focusedIndex() === i()}
                          onSelect={handleSelect}
                        />
                      )}
                    </For>
                  </Show>
                }
              >
                <For each={visibleItems()}>
                  {(item, i) => (
                    <CategoryTreeNode
                      label={item.node.label}
                      value={item.node.value}
                      depth={item.breadcrumb.length}
                      hasChildren={(item.node.children?.length ?? 0) > 0}
                      isOpen={expanded().has(item.node.value)}
                      selected={props.value === item.node.value}
                      focused={focusedIndex() === i()}
                      onToggle={toggleExpand}
                      onSelect={handleSelect}
                    />
                  )}
                </For>
              </Show>
            </Show>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
