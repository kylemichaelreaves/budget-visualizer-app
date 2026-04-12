import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterMemoMutation } from '@api/queryInvalidation'
import useMemos from '@api/hooks/memos/useMemos'
import useMemosCount from '@api/hooks/memos/useMemosCount'
import { updateMemo } from '@api/memos/updateMemo'
import AlertComponent from '@components/shared/AlertComponent'
import TableSkeleton from '@components/shared/TableSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { transactionsState, updateMemosTableOffset } from '@stores/transactionsStore'
import type { Memo } from '@types'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { devConsole } from '@utils/devConsole'
import {
  MEMOS_SEARCH_PREFETCH_DEBOUNCE_MS,
  MEMOS_SEARCH_PREFETCH_MAX_PAGES,
} from '@components/memos/memosTableConstants'
import { SearchIcon } from '@components/memos/memosTableIcons'
import {
  compareMemos,
  MEMOS_TABLE_SORTABLE_COLUMNS,
  type MemosTableSortDir,
  type MemosTableSortKey,
} from '@components/memos/memosTableSort'
import MemosTablePagination from './MemosTablePagination'
import MemosTableRow from '@components/memos/MemosTableRow'
import MemosTableSortIcon from '@components/memos/MemosTableSortIcon'

export default function MemosTable(): JSX.Element {
  const query = useMemos()
  const countQuery = useMemosCount()
  const queryClient = useQueryClient()

  let fetchNextPageQueue: Promise<unknown> = Promise.resolve()
  function enqueueFetchNextPage() {
    const next = fetchNextPageQueue.then(() => query.fetchNextPage())
    fetchNextPageQueue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  const LIMIT = () => transactionsState.memosTableLimit

  const [searchQuery, setSearchQuery] = createSignal('')
  const [tableMutationError, setTableMutationError] = createSignal<string | null>(null)
  const [togglingAmbiguousId, setTogglingAmbiguousId] = createSignal<number | null>(null)
  const [sortKey, setSortKey] = createSignal<MemosTableSortKey | null>(null)
  const [sortDir, setSortDir] = createSignal<MemosTableSortDir>('asc')

  const flattenedData = createMemo(() => query.data?.pages.flat() ?? [])

  const filteredData = createMemo(() => {
    const q = searchQuery().toLowerCase().trim()
    let data = flattenedData()
    if (q) {
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.budget_category && m.budget_category.toLowerCase().includes(q)),
      )
    }
    const sk = sortKey()
    if (sk) {
      const dir = sortDir()
      data = [...data].sort((a, b) => compareMemos(a, b, sk, dir))
    }
    return data
  })

  const currentPage = () =>
    Math.floor(transactionsState.memosTableOffset / transactionsState.memosTableLimit) + 1

  const paginatedData = createMemo(() => {
    const start = (currentPage() - 1) * LIMIT()
    return filteredData().slice(start, start + LIMIT())
  })

  const totalMemos = createMemo(() => filteredData().length)
  const ambiguousCount = createMemo(() => filteredData().filter((m) => m.ambiguous).length)

  const headerUniqueTotal = createMemo(() => {
    if (searchQuery().trim()) return totalMemos()
    if (countQuery.data !== undefined) return countQuery.data
    if (countQuery.isError) return flattenedData().length
    return null
  })

  const headerAmbiguousCount = createMemo(() => {
    if (searchQuery().trim()) return ambiguousCount()
    return flattenedData().filter((m) => m.ambiguous).length
  })

  const headerAmbiguousPartial = () => !searchQuery().trim() && query.hasNextPage

  const isInitialLoading = () => query.isLoading || (query.isFetching && !query.data?.pages?.length)

  const isLoadingCondition = () =>
    isInitialLoading() || query.isFetchingPreviousPage || (query.isFetchingNextPage && !searchQuery().trim())

  createEffect(
    on(
      () => searchQuery().trim(),
      (q) => {
        let cancelled = false
        let debounceId: ReturnType<typeof setTimeout> | undefined
        onCleanup(() => {
          cancelled = true
          if (debounceId !== undefined) clearTimeout(debounceId)
        })
        if (!q) return
        debounceId = setTimeout(() => {
          debounceId = undefined
          if (cancelled) return
          void (async () => {
            try {
              let pages = 0
              while (!cancelled && query.hasNextPage && pages < MEMOS_SEARCH_PREFETCH_MAX_PAGES) {
                if (searchQuery().trim() !== q) return
                await enqueueFetchNextPage()
                pages += 1
              }
            } catch (e) {
              devConsole('error', 'MemosTable search prefetch failed', e)
            }
          })()
        }, MEMOS_SEARCH_PREFETCH_DEBOUNCE_MS)
      },
    ),
  )

  async function loadMorePagesIfNeeded() {
    const limit = LIMIT()
    const page = currentPage()
    const start = (page - 1) * limit
    const end = start + limit

    try {
      if (!searchQuery().trim()) {
        const requiredFlat = page * limit
        while (flattenedData().length < requiredFlat && query.hasNextPage) {
          await enqueueFetchNextPage()
        }
        return
      }

      let searchFetchIters = 0
      while (
        filteredData().length < end &&
        query.hasNextPage &&
        searchFetchIters < MEMOS_SEARCH_PREFETCH_MAX_PAGES
      ) {
        await enqueueFetchNextPage()
        searchFetchIters += 1
      }
    } catch (e) {
      devConsole('error', 'MemosTable loadMorePagesIfNeeded failed', e)
    }
  }

  createEffect(
    on(
      () => [currentPage(), searchQuery()] as const,
      () => {
        void loadMorePagesIfNeeded()
      },
    ),
  )

  createEffect(
    on(
      () => [searchQuery(), sortKey(), sortDir()] as const,
      () => {
        updateMemosTableOffset(0)
      },
      { defer: true },
    ),
  )

  function handleSort(key: MemosTableSortKey) {
    if (sortKey() === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  async function toggleAmbiguous(memo: Memo) {
    setTableMutationError(null)
    setTogglingAmbiguousId(memo.id)
    try {
      await updateMemo({
        id: memo.id,
        name: memo.name,
        ambiguous: !memo.ambiguous,
      })
      await invalidateAfterMemoMutation(queryClient)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not update memo'
      setTableMutationError(msg)
      devConsole('error', 'toggleAmbiguous failed', e)
    } finally {
      setTogglingAmbiguousId(null)
    }
  }

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [categoryDialogTarget, setCategoryDialogTarget] = createSignal<Memo | null>(null)
  const [mutatingCategoryId, setMutatingCategoryId] = createSignal<number | null>(null)

  function handleAssignCategory(memo: Memo) {
    setCategoryDialogTarget(memo)
    setCategoryDialogOpen(true)
  }

  async function handleCategorySelect(category: string) {
    const target = categoryDialogTarget()
    if (!target) return
    setTableMutationError(null)
    setMutatingCategoryId(target.id)
    try {
      await updateMemo({
        id: target.id,
        name: target.name,
        budgetCategory: category,
      })
      await invalidateAfterMemoMutation(queryClient)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not assign category'
      setTableMutationError(msg)
      devConsole('error', 'Failed to update memo category:', e)
    } finally {
      setMutatingCategoryId(null)
    }
  }

  return (
    <>
      <Show when={query.isError && query.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId="memos-table-error-alert"
          />
        )}
      </Show>

      <Show when={tableMutationError()}>
        {(msg) => (
          <AlertComponent
            type="error"
            title="Update failed"
            message={msg()}
            dataTestId="memos-table-mutation-error"
            close={() => setTableMutationError(null)}
          />
        )}
      </Show>

      <div class="mb-4">
        <h2 class="text-foreground mt-0 text-2xl font-semibold">Memos</h2>
        <p class="text-muted-foreground text-sm">
          <Show when={headerUniqueTotal() != null} fallback={<span>Loading memo totals…</span>}>
            <span>
              {headerUniqueTotal()} unique memos
              <Show when={searchQuery().trim()}>
                <span class="text-muted-foreground font-normal"> (search results)</span>
              </Show>
            </span>
          </Show>
          <Show when={headerAmbiguousCount() > 0}>
            {' '}
            <span class="text-amber-600 dark:text-amber-400 font-medium">
              ({headerAmbiguousCount()} ambiguous
              <Show when={headerAmbiguousPartial()}>
                <span class="font-normal text-muted-foreground"> — loaded pages only</span>
              </Show>
              )
            </span>
          </Show>
        </p>
      </div>

      <Card>
        <CardHeader class="border-b">
          <div class="flex items-center justify-between gap-4">
            <CardTitle class="text-lg">All Memos</CardTitle>
            <div class="relative w-64">
              <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <SearchIcon />
              </span>
              <Input
                type="text"
                placeholder="Search memos..."
                value={searchQuery()}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                class="pl-9"
                data-testid="memos-search-input"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Show when={isLoadingCondition()}>
            <TableSkeleton
              columns={MEMOS_TABLE_SORTABLE_COLUMNS.map((c) => ({ prop: c.key, label: c.label }))}
              rows={LIMIT()}
              dataTestId="memos-table-skeleton"
            />
          </Show>

          <Show when={!isLoadingCondition() && paginatedData().length > 0}>
            <div class="overflow-x-auto">
              <table data-testid="memos-table" class="w-full border-collapse text-foreground text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <For each={MEMOS_TABLE_SORTABLE_COLUMNS}>
                      {(col) => (
                        <th class="px-3 py-2.5 text-left" scope="col" data-testid={`column-${col.key}`}>
                          <button
                            type="button"
                            class="flex w-full min-w-0 items-center gap-1 rounded-sm text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none border-none bg-transparent p-0 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={() => handleSort(col.key)}
                            aria-label={`Sort by ${col.label}`}
                          >
                            {col.label}
                            <MemosTableSortIcon columnKey={col.key} sortKey={sortKey} sortDir={sortDir} />
                          </button>
                        </th>
                      )}
                    </For>
                  </tr>
                </thead>
                <tbody>
                  <For each={paginatedData()}>
                    {(row) => (
                      <MemosTableRow
                        row={row}
                        togglingAmbiguousId={togglingAmbiguousId}
                        mutatingCategoryId={mutatingCategoryId}
                        onToggleAmbiguous={toggleAmbiguous}
                        onAssignCategory={handleAssignCategory}
                      />
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>

          <Show when={!isLoadingCondition() && paginatedData().length === 0}>
            <p class="text-muted-foreground py-8 text-center">No memos found.</p>
          </Show>
        </CardContent>
      </Card>

      <MemosTablePagination clientFilteredTotal={() => (searchQuery().trim() ? totalMemos() : undefined)} />

      <CategoryTreeSelectDialog
        open={categoryDialogOpen()}
        onOpenChange={setCategoryDialogOpen}
        value={categoryDialogTarget()?.budget_category ?? ''}
        onSelect={handleCategorySelect}
        subtitle={categoryDialogTarget()?.name}
      />
    </>
  )
}
