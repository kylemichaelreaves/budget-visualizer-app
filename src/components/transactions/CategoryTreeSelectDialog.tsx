import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import { SearchIcon } from '@shared/icons'
import { Input } from '@components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui/dialog'
import { useCategoryTreeSelectDialog } from './selects/useCategoryTreeSelectDialog'
import CategoryTreeNodeRow from './selects/CategoryTreeNodeRow'
import CategoryTreeSearchResultRow from './selects/CategoryTreeSearchResultRow'

export default function CategoryTreeSelectDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: string
  onSelect: (value: string) => void
  title?: string
  subtitle?: string
}): JSX.Element {
  const state = useCategoryTreeSelectDialog({
    open: () => props.open,
    onSelect: (v) => props.onSelect(v),
    onOpenChange: (v) => props.onOpenChange(v),
  })

  return (
    <Dialog
      open={props.open}
      onOpenChange={(v) => {
        props.onOpenChange(v)
        if (!v) state.setSearch('')
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
            <span
              class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            >
              <SearchIcon class="size-3.5" />
            </span>
            <Input
              autofocus
              class="h-8 pl-8 text-sm"
              placeholder="Search categories..."
              data-testid="category-tree-search"
              value={state.search()}
              onInput={(e) => state.setSearch(e.currentTarget.value)}
              onKeyDown={state.handleKeyDown}
            />
          </div>
        </div>

        <div class="px-2 pb-3 max-h-72 overflow-y-auto space-y-0.5" ref={state.setListRef}>
          <Show when={state.q.isLoading || state.q.isFetching}>
            <p class="text-sm text-muted-foreground text-center py-6">Loading categories...</p>
          </Show>

          <Show when={!state.q.isLoading && !state.q.isFetching}>
            <Show
              when={state.searchResults() === null}
              fallback={
                <Show
                  when={state.searchResults()!.length > 0}
                  fallback={<p class="text-sm text-muted-foreground text-center py-6">No categories found</p>}
                >
                  <div>
                    <For each={state.searchResults()!}>
                      {({ node, breadcrumb }, index) => (
                        <CategoryTreeSearchResultRow
                          label={node.label}
                          breadcrumb={breadcrumb}
                          selected={props.value === node.value}
                          highlighted={state.highlight() === index()}
                          onSelect={() => state.handleSelect(node.value)}
                          onHighlight={() => state.setHighlight(index())}
                        />
                      )}
                    </For>
                  </div>
                </Show>
              }
            >
              <For each={state.tree()}>
                {(node) => (
                  <CategoryTreeNodeRow
                    node={node}
                    depth={0}
                    selected={props.value}
                    expanded={state.expanded()}
                    highlighted={state.highlight()}
                    treeNavIndexByValue={state.treeNavIndexByValue}
                    onToggle={state.toggleExpand}
                    onSelect={state.handleSelect}
                    onHighlight={state.setHighlight}
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
