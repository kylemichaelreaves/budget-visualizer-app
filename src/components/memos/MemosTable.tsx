import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { createEffect, createMemo, createSignal, For, on, onCleanup, Show } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import useMemos from '@api/hooks/memos/useMemos'
import { httpClient } from '@api/httpClient'
import AlertComponent from '@components/shared/AlertComponent'
import TableSkeleton from '@components/shared/TableSkeleton'
import { Badge } from '@components/ui/badge'
import { Button } from '@components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Input } from '@components/ui/input'
import { Skeleton } from '@components/ui/skeleton'
import { transactionsState, updateMemosTableOffset } from '@stores/transactionsStore'
import type { Memo } from '@types'
import CategoryTreeSelectDialog from '@components/transactions/CategoryTreeSelectDialog'
import { devConsole } from '@utils/devConsole'
import MemosTablePagination from './MemosTablePagination'

/** Debounce before prefetching all pages for client search (reduces request bursts while typing). */
const MEMOS_SEARCH_PREFETCH_DEBOUNCE_MS = 400

// --- Inline SVG Icons ---

function ChevronUpIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function ChevronUpDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  )
}

function WarningIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
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
  )
}

// --- Helpers ---

type SortKey = 'name' | 'transactions_count' | 'ambiguous' | 'budget_category' | 'total_amount_debit'
type SortDir = 'asc' | 'desc'

const sortableColumns: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Memo' },
  { key: 'transactions_count', label: 'Transactions' },
  { key: 'ambiguous', label: 'Ambiguous' },
  { key: 'budget_category', label: 'Budget Category' },
  { key: 'total_amount_debit', label: 'Total Debit' },
]

function formatCurrency(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return '--'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

// Simple deterministic color for category pills
const categoryColors: Record<string, string> = {}
const palette = [
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
  'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
]

function getCategoryColor(category: string): string {
  if (!categoryColors[category]) {
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = (hash * 31 + category.charCodeAt(i)) | 0
    }
    categoryColors[category] = palette[Math.abs(hash) % palette.length]
  }
  return categoryColors[category]
}

function compareMemos(a: Memo, b: Memo, key: SortKey, dir: SortDir): number {
  const av = a[key]
  const bv = b[key]

  let result: number
  if (av == null && bv == null) result = 0
  else if (av == null) result = 1
  else if (bv == null) result = -1
  else if (typeof av === 'string' && typeof bv === 'string') result = av.localeCompare(bv)
  else if (typeof av === 'boolean' && typeof bv === 'boolean') result = Number(av) - Number(bv)
  else if (typeof av === 'number' && typeof bv === 'number') result = av - bv
  else result = String(av).localeCompare(String(bv))

  return dir === 'desc' ? -result : result
}

// --- Component ---

export default function MemosTable(): JSX.Element {
  const query = useMemos()
  const queryClient = useQueryClient()

  const LIMIT = () => transactionsState.memosTableLimit

  const [searchQuery, setSearchQuery] = createSignal('')
  const [tableMutationError, setTableMutationError] = createSignal<string | null>(null)
  const [togglingAmbiguousId, setTogglingAmbiguousId] = createSignal<number | null>(null)
  const [sortKey, setSortKey] = createSignal<SortKey | null>(null)
  const [sortDir, setSortDir] = createSignal<SortDir>('asc')

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

  const isInitialLoading = () => query.isLoading || (query.isFetching && !query.data?.pages?.length)

  /** With active client search, prefetch extra pages in the background — do not swap the table for skeleton on each page. */
  const isLoadingCondition = () =>
    isInitialLoading() || query.isFetchingPreviousPage || (query.isFetchingNextPage && !searchQuery().trim())

  /** Load every page while searching so filtered totals / page counts match the full memo list. */
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
              while (!cancelled && query.hasNextPage) {
                if (searchQuery().trim() !== q) return
                await query.fetchNextPage()
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
          await query.fetchNextPage()
        }
        return
      }

      // Client-side search: keep loading pages until the filtered slice can fill the current page or data is exhausted.
      while (filteredData().length < end && query.hasNextPage) {
        await query.fetchNextPage()
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

  // Query auto-refetches when memosTableLimit changes (it's in the query key)

  function handleSort(key: SortKey) {
    if (sortKey() === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  function SortIcon(props: { columnKey: SortKey }) {
    return (
      <Show when={sortKey() === props.columnKey} fallback={<ChevronUpDownIcon />}>
        {sortDir() === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </Show>
    )
  }

  async function toggleAmbiguous(memo: Memo) {
    setTableMutationError(null)
    setTogglingAmbiguousId(memo.id)
    try {
      await httpClient.patch(`/memos/${memo.id}`, {
        name: memo.name,
        ambiguous: !memo.ambiguous,
      })
      await queryClient.invalidateQueries({ queryKey: ['memos'] })
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
      await httpClient.patch(`/memos/${target.id}`, {
        name: target.name,
        budgetCategory: category,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['memos'] }),
        queryClient.invalidateQueries({ queryKey: ['transactions'] }),
      ])
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

      {/* Page header */}
      <div class="mb-4">
        <h2 class="text-foreground mt-0 text-2xl font-semibold">Memos</h2>
        <p class="text-muted-foreground text-sm">
          {totalMemos()} unique memos
          <Show when={ambiguousCount() > 0}>
            {' '}
            <span class="text-amber-600 dark:text-amber-400 font-medium">({ambiguousCount()} ambiguous)</span>
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
              columns={sortableColumns.map((c) => ({ prop: c.key, label: c.label }))}
              rows={LIMIT()}
              dataTestId="memos-table-skeleton"
            />
          </Show>

          <Show when={!isLoadingCondition() && paginatedData().length > 0}>
            <div class="overflow-x-auto">
              <table data-testid="memos-table" class="w-full border-collapse text-foreground text-sm">
                <thead>
                  <tr class="border-b border-border">
                    <For each={sortableColumns}>
                      {(col) => (
                        <th
                          class="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors"
                          data-testid={`column-${col.key}`}
                          onClick={() => handleSort(col.key)}
                        >
                          <div class="flex items-center gap-1">
                            {col.label}
                            <SortIcon columnKey={col.key} />
                          </div>
                        </th>
                      )}
                    </For>
                  </tr>
                </thead>
                <tbody>
                  <For each={paginatedData()}>
                    {(row) => (
                      <tr class="border-b border-border hover:bg-muted/50 transition-colors">
                        {/* Memo name (link) */}
                        <td class="px-3 py-2.5" data-testid={`cell-${row.id}-name`}>
                          <A
                            href={`/budget-visualizer/memos/${row.id}/summary`}
                            class="text-primary hover:underline font-medium"
                            data-testid={`memo-name-link-${row.id}`}
                          >
                            {row.name}
                          </A>
                        </td>

                        {/* Transactions count */}
                        <td
                          class="px-3 py-2.5 text-muted-foreground"
                          data-testid={`cell-${row.id}-transactions_count`}
                        >
                          {row.transactions_count ?? 0}
                        </td>

                        {/* Ambiguous toggle */}
                        <td class="px-3 py-2.5" data-testid={`cell-${row.id}-ambiguous`}>
                          <button
                            type="button"
                            disabled={togglingAmbiguousId() === row.id}
                            class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              row.ambiguous
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/70'
                                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70'
                            }`}
                            onClick={() => void toggleAmbiguous(row)}
                            data-testid={`ambiguous-toggle-${row.id}`}
                          >
                            <Show
                              when={row.ambiguous}
                              fallback={
                                <>
                                  <CheckIcon /> No
                                </>
                              }
                            >
                              <WarningIcon /> Yes
                            </Show>
                          </button>
                        </td>

                        {/* Budget category */}
                        <td class="px-3 py-2.5" data-testid={`cell-${row.id}-budget_category`}>
                          <Show
                            when={mutatingCategoryId() !== row.id}
                            fallback={<Skeleton class="h-6 w-24 rounded-full" />}
                          >
                            <Show
                              when={row.budget_category}
                              fallback={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  class="border-dashed text-muted-foreground text-xs h-7"
                                  onClick={() => handleAssignCategory(row)}
                                  data-testid={`assign-category-${row.id}`}
                                >
                                  Assign category
                                </Button>
                              }
                            >
                              <Badge
                                class={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium border-0 ${getCategoryColor(row.budget_category!)}`}
                                onClick={() => handleAssignCategory(row)}
                                data-testid={`category-badge-${row.id}`}
                              >
                                {row.budget_category}
                              </Badge>
                            </Show>
                          </Show>
                        </td>

                        {/* Total debit */}
                        <td
                          class="px-3 py-2.5 text-red-600 dark:text-red-400 font-medium tabular-nums"
                          data-testid={`cell-${row.id}-total_amount_debit`}
                        >
                          {formatCurrency(row.total_amount_debit)}
                        </td>
                      </tr>
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
