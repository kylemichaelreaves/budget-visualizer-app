import { createRoot, createSignal } from 'solid-js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Memo } from '@types'
import { compareMemos } from '@components/memos/table/memosTableSort'

type InfiniteOptions = {
  queryKey: readonly unknown[]
  queryFn: (ctx: { pageParam: number }) => Promise<unknown>
}

const fetchMemos = vi.fn<(params: Record<string, unknown>) => Promise<unknown>>(async () => [])
let options!: () => InfiniteOptions

vi.mock('@api/memos/fetchMemos', () => ({ fetchMemos }))
vi.mock('@tanstack/solid-query', () => ({
  useInfiniteQuery: (opts: () => InfiniteOptions) => {
    options = opts
    return {}
  },
}))

const { default: useMemos } = await import('@api/hooks/memos/useMemos')

describe('useMemos sort', () => {
  beforeEach(() => {
    fetchMemos.mockClear()
  })

  // #83: sorting only reordered the pages already loaded.
  it('asks the server to sort before paging', async () => {
    createRoot(() => useMemos(() => ({ key: 'total_amount_debit', dir: 'desc' })))
    await options().queryFn({ pageParam: 100 })
    expect(fetchMemos).toHaveBeenCalledExactlyOnceWith({
      limit: 100,
      offset: 100,
      sortKey: 'total_amount_debit',
      sortDir: 'desc',
    })
  })

  it('sends no sort params without a sort', async () => {
    createRoot(() => useMemos())
    await options().queryFn({ pageParam: 0 })
    expect(fetchMemos).toHaveBeenCalledExactlyOnceWith({ limit: 100, offset: 0 })
  })

  // A new key starts a fresh infinite query, so pages from another order never mix.
  it('keys the pages by the sort', () => {
    const [sort, setSort] = createSignal<{ key: string | null; dir: 'asc' | 'desc' }>({
      key: null,
      dir: 'asc',
    })
    createRoot(() => useMemos(sort))
    expect(options().queryKey).toEqual(['memos', 100, null, 'asc'])
    setSort({ key: 'name', dir: 'desc' })
    expect(options().queryKey).toEqual(['memos', 100, 'name', 'desc'])
  })
})

describe('compareMemos', () => {
  const memo = (budget_category: string | null) => ({ id: 1, name: 'x', budget_category }) as Memo
  const order = (dir: 'asc' | 'desc') =>
    [memo('Rent'), memo(null), memo('Food')]
      .sort((a, b) => compareMemos(a, b, 'budget_category', dir))
      .map((m) => m.budget_category)

  // Matches the API's NULLS LAST, so a re-sort of server-ordered pages keeps their order.
  it('puts missing values last in both directions', () => {
    expect(order('asc')).toEqual(['Food', 'Rent', null])
    expect(order('desc')).toEqual(['Rent', 'Food', null])
  })
})
