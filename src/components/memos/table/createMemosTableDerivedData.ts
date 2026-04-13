import { createMemo, createSignal } from 'solid-js'
import useMemos from '@api/hooks/memos/useMemos'
import useMemosCount from '@api/hooks/memos/useMemosCount'
import { createMemosTableInfiniteSync } from '@components/memos/table/createMemosTableInfiniteSync'
import {
  compareMemos,
  type MemosTableSortDir,
  type MemosTableSortKey,
} from '@components/memos/table/memosTableSort'
import { transactionsState } from '@stores/transactionsStore'

export function createMemosTableDerivedData() {
  const query = useMemos()
  const countQuery = useMemosCount()

  const LIMIT = () => transactionsState.memosTableLimit

  const [searchQuery, setSearchQuery] = createSignal('')
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

  createMemosTableInfiniteSync(query, {
    searchQuery,
    sortKey,
    sortDir,
    flattenedData,
    filteredData,
    currentPage,
    limit: LIMIT,
  })

  function handleSort(key: MemosTableSortKey) {
    if (sortKey() === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return {
    query,
    searchQuery,
    setSearchQuery,
    sortKey,
    sortDir,
    paginatedData,
    totalMemos,
    headerUniqueTotal,
    headerAmbiguousCount,
    headerAmbiguousPartial,
    isLoadingCondition,
    LIMIT,
    handleSort,
  }
}
