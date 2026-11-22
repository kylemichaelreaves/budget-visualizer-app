import { createRoot, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Memo } from '@types'
import { setMemosTableLimit, updateMemosTableOffset } from '@stores/transactionsStore'
import { fakeQuery } from '../setup/fakeQuery'

const memo = (id: number, name: string, ambiguous = false, budget_category: string | null = null) =>
  ({ id, name, ambiguous, budget_category }) as Memo

const [memos, setMemos] = fakeQuery<{ pages: Memo[][] }>()
const [count, setCount] = fakeQuery<number>()
const fetchNextPage = vi.fn(async () => undefined)
const memosQuery = new Proxy(memos, {
  get: (t, k) =>
    k === 'fetchNextPage' ? fetchNextPage : k === 'hasNextPage' ? false : t[k as keyof typeof t],
})
vi.mock('@api/hooks/memos/useMemos', () => ({
  default: () => memosQuery,
}))
vi.mock('@api/hooks/memos/useMemosCount', () => ({ default: () => count }))

const { createMemosTableDerivedData } = await import('@components/memos/table/createMemosTableDerivedData')

let dispose: () => void
function mount() {
  const d = createRoot((disp) => {
    dispose = disp
    return createMemosTableDerivedData()
  })
  flush()
  return d
}

describe('createMemosTableDerivedData', () => {
  beforeEach(() => {
    setMemosTableLimit(2)
    updateMemosTableOffset(0)
    flush()
    setMemos({
      isPending: false,
      isLoading: false,
      isFetching: false,
      data: {
        pages: [
          [memo(1, 'Rent', true, 'Housing')],
          [memo(2, 'Coffee', false, 'Food'), memo(3, 'Bakery', true)],
        ],
      },
    })
    setCount({ isPending: false, isError: false, data: 40 })
  })
  afterEach(() => dispose())

  it('pages the loaded memos and reports the server count', () => {
    const d = mount()
    expect(d.paginatedData().map((m) => m.id)).toEqual([1, 2])
    expect(d.headerUniqueTotal()).toBe(40)
    expect(d.headerAmbiguousCount()).toBe(2)
    expect(d.isLoadingCondition()).toBe(false)
  })

  it('filters by name or category and counts the matches', () => {
    const d = mount()
    d.setSearchQuery('foo')
    flush()
    expect(d.paginatedData().map((m) => m.name)).toEqual(['Coffee'])
    expect(d.headerUniqueTotal()).toBe(1)
    expect(d.headerAmbiguousCount()).toBe(0)
  })

  it('toggles the sort direction and sorts the loaded memos', () => {
    const d = mount()
    d.handleSort('name')
    flush()
    expect([d.sortKey(), d.sortDir()]).toEqual(['name', 'asc'])
    expect(d.paginatedData().map((m) => m.name)).toEqual(['Bakery', 'Coffee'])
    d.handleSort('name')
    flush()
    expect(d.sortDir()).toBe('desc')
    expect(d.paginatedData().map((m) => m.name)).toEqual(['Rent', 'Coffee'])
  })

  it('falls back to the loaded count when the count query fails, and to null while it loads', () => {
    setCount({ isPending: false, isError: true, data: undefined, dataUpdatedAt: 0 })
    const d = mount()
    expect(d.headerUniqueTotal()).toBe(3)
    setCount({ isPending: true, isError: false })
    expect(d.headerUniqueTotal()).toBeNull()
  })

  it('is loading on the first fetch', () => {
    setMemos({ isPending: true, isLoading: true, isFetching: true, data: undefined })
    const d = mount()
    expect(d.isLoadingCondition()).toBe(true)
    expect(d.paginatedData()).toEqual([])
  })
})
