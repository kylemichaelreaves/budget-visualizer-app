import type { Accessor } from 'solid-js'
import { createEffect, on, onCleanup } from 'solid-js'
import type { MemosTableSortDir, MemosTableSortKey } from '@components/memos/table/memosTableSort'
import {
  MEMOS_SEARCH_PREFETCH_DEBOUNCE_MS,
  MEMOS_SEARCH_PREFETCH_MAX_PAGES,
} from '@components/memos/table/memosTableConstants'
import { updateMemosTableOffset } from '@stores/transactionsStore'
import type { Memo } from '@types'
import { devConsole } from '@utils/devConsole'

type MemosInfiniteQuery = {
  fetchNextPage: () => Promise<unknown>
  hasNextPage: boolean
}

/** Serializes fetchNextPage and wires search prefetch + pagination slice hydration. */
export function createMemosTableInfiniteSync(
  query: MemosInfiniteQuery,
  opts: {
    searchQuery: Accessor<string>
    sortKey: Accessor<MemosTableSortKey | null>
    sortDir: Accessor<MemosTableSortDir>
    flattenedData: Accessor<Memo[]>
    filteredData: Accessor<Memo[]>
    currentPage: () => number
    limit: () => number
  },
) {
  let fetchNextPageQueue: Promise<unknown> = Promise.resolve()

  function enqueueFetchNextPage() {
    const next = fetchNextPageQueue.then(() => query.fetchNextPage())
    fetchNextPageQueue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  createEffect(
    on(
      () => opts.searchQuery().trim(),
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
                if (opts.searchQuery().trim() !== q) return
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
    const limit = opts.limit()
    const page = opts.currentPage()
    const start = (page - 1) * limit
    const end = start + limit

    try {
      if (!opts.searchQuery().trim()) {
        const requiredFlat = page * limit
        while (opts.flattenedData().length < requiredFlat && query.hasNextPage) {
          await enqueueFetchNextPage()
        }
        return
      }

      let searchFetchIters = 0
      while (
        opts.filteredData().length < end &&
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
      () => [opts.currentPage(), opts.searchQuery()] as const,
      () => {
        void loadMorePagesIfNeeded()
      },
    ),
  )

  createEffect(
    on(
      () => [opts.searchQuery(), opts.sortKey(), opts.sortDir()] as const,
      () => {
        updateMemosTableOffset(0)
      },
      { defer: true },
    ),
  )
}
