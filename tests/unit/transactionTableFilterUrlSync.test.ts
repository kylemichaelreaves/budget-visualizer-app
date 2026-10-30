import { createRoot } from 'solid-js'
import { createStore } from 'solid-js/store'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Memo } from '@types'

/**
 * A reactive stand-in for the router: `navigate` writes the location store, so the
 * hook's URL→store effect re-runs exactly as it does on a real `replace` navigation.
 */
const [loc, setLoc] = createStore({ pathname: '/budget-visualizer/transactions', search: '' })
const navigate = vi.fn((to: string) => {
  const url = new URL(to, 'http://app.test')
  setLoc({ pathname: url.pathname, search: url.search })
})
vi.mock('@solidjs/router', () => ({ useLocation: () => loc, useNavigate: () => navigate }))

const [memoQuery, setMemoQuery] = createStore<{ data: Memo | undefined }>({ data: undefined })
vi.mock('@api/hooks/memos/useMemoById', () => ({ useMemoById: () => memoQuery }))

const { useTransactionTableFilterUrlSync } = await import('@composables/transactionTableFilterUrlSync')
const store = await import('@stores/transactionsStore')
const { transactionsState } = store

let dispose: (() => void) | undefined

/** Mount the hook at `path` (pathname plus optional query). */
function mountAt(path: string) {
  const url = new URL(path, 'http://app.test')
  setLoc({ pathname: url.pathname, search: url.search })
  navigate.mockClear()
  createRoot((d) => {
    dispose = d
    useTransactionTableFilterUrlSync()
  })
}

const search = () => new URLSearchParams(loc.search)

beforeEach(() => {
  store.clearAllFilters()
  setMemoQuery({ data: undefined })
})

afterEach(() => dispose?.())

describe('URL → store', () => {
  it.each([
    ['day', '2026-03-01', 'selectedDay'],
    ['week', '09-2026', 'selectedWeek'],
    ['month', '03-2026', 'selectedMonth'],
    ['year', '2026', 'selectedYear'],
  ] as const)('?%s= selects that view', (param, value, field) => {
    mountAt(`/budget-visualizer/transactions?${param}=${value}`)
    expect(transactionsState.viewMode).toBe(param)
    expect(transactionsState[field]).toBe(value)
  })

  it('applies budgetCategory alongside a timeframe', () => {
    mountAt('/budget-visualizer/transactions?month=03-2026&budgetCategory=Food')
    expect(transactionsState.selectedMonth).toBe('03-2026')
    expect(transactionsState.selectedBudgetCategory).toBe('Food')
  })

  it('?memoName= selects the memo by name', () => {
    mountAt('/budget-visualizer/transactions?memoName=WHOLEFDS')
    expect(transactionsState.viewMode).toBe('memo')
    expect(transactionsState.selectedMemo).toBe('WHOLEFDS')
  })

  it('?memoId= scopes by id at once, then fills in the name when the memo loads', () => {
    mountAt('/budget-visualizer/transactions?memoId=12')
    expect(transactionsState.viewMode).toBe('memo')
    expect(transactionsState.selectedMemoId).toBe(12)

    setMemoQuery({ data: { id: 12, name: 'WHOLEFDS', recurring: false, necessary: false, ambiguous: false } })
    expect(transactionsState.selectedMemo).toBe('WHOLEFDS')
    expect(search().get('memoId')).toBe('12')
  })

  it('lets a timeframe win over memoId', () => {
    mountAt('/budget-visualizer/transactions?month=03-2026&memoId=12')
    expect(transactionsState.viewMode).toBe('month')
    expect(transactionsState.selectedMemoId).toBeNull()
  })

  it.each(['abc', '0', '-3', '1.5', ''])('strips an invalid memoId (%j) and clears filters', (raw) => {
    store.selectMonthView('01-2026')
    mountAt(`/budget-visualizer/transactions?memoId=${raw}`)
    expect(search().has('memoId')).toBe(false)
    expect(transactionsState.viewMode).toBeNull()
  })

  it('migrates a legacy ?memo=<name> link to memoName', () => {
    mountAt('/budget-visualizer/transactions?memo=WHOLEFDS')
    expect(search().has('memo')).toBe(false)
    expect(search().get('memoName')).toBe('WHOLEFDS')
    expect(transactionsState.selectedMemo).toBe('WHOLEFDS')
  })

  it('migrates a legacy numeric ?memo= link to memoId', () => {
    mountAt('/budget-visualizer/transactions?memo=12')
    expect(search().get('memoId')).toBe('12')
    expect(transactionsState.selectedMemoId).toBe(12)
  })

  it('clears filters when navigating to the bare route', () => {
    mountAt('/budget-visualizer/transactions?month=03-2026')
    setLoc({ search: '' })
    expect(transactionsState.viewMode).toBeNull()
    expect(transactionsState.selectedMonth).toBe('')
  })

  it('follows back/forward between periods', () => {
    mountAt('/budget-visualizer/transactions?month=03-2026')
    setLoc({ search: '?month=04-2026' })
    expect(transactionsState.selectedMonth).toBe('04-2026')
  })

  // #74: both memo selectors clear every selection, so this deep link used to lose
  // its category, first in the store and then in the URL.
  describe('memoId + budgetCategory deep link (#74)', () => {
    const memo12: Memo = { id: 12, name: 'WHOLEFDS', recurring: false, necessary: false, ambiguous: false }

    it('keeps the category while scoped by id', () => {
      mountAt('/budget-visualizer/transactions?memoId=12&budgetCategory=Food')
      expect(transactionsState.selectedMemoId).toBe(12)
      expect(transactionsState.selectedBudgetCategory).toBe('Food')
      expect(search().get('budgetCategory')).toBe('Food')
    })

    it('keeps the category after the memo name loads', () => {
      mountAt('/budget-visualizer/transactions?memoId=12&budgetCategory=Food')
      setMemoQuery({ data: memo12 })
      expect(transactionsState.selectedMemo).toBe('WHOLEFDS')
      expect(transactionsState.selectedBudgetCategory).toBe('Food')
      expect(search().get('memoId')).toBe('12')
      expect(search().get('budgetCategory')).toBe('Food')
    })

    it('does not rewrite the URL while restoring it', () => {
      mountAt('/budget-visualizer/transactions?memoId=12&budgetCategory=Food')
      setMemoQuery({ data: memo12 })
      expect(navigate).not.toHaveBeenCalled()
    })

    it('still follows a category change made in the UI', () => {
      mountAt('/budget-visualizer/transactions?memoId=12&budgetCategory=Food')
      setMemoQuery({ data: memo12 })
      store.setSelectedBudgetCategory('Gas')
      expect(search().get('budgetCategory')).toBe('Gas')
      expect(transactionsState.selectedMemoId).toBe(12)
    })

    it('leaves the category unset when the link has none', () => {
      mountAt('/budget-visualizer/transactions?memoId=12')
      setMemoQuery({ data: memo12 })
      expect(transactionsState.selectedBudgetCategory).toBeNull()
      expect(search().has('budgetCategory')).toBe(false)
    })
  })
})

describe('store → URL', () => {
  it('writes the active period with replace', () => {
    mountAt('/budget-visualizer/transactions')
    store.selectWeekView('09-2026')
    expect(loc.search).toBe('?week=09-2026')
    expect(navigate).toHaveBeenLastCalledWith('/budget-visualizer/transactions?week=09-2026', {
      replace: true,
    })
  })

  it('replaces the previous filter rather than accumulating', () => {
    mountAt('/budget-visualizer/transactions?month=03-2026')
    store.selectYearView('2026')
    expect(loc.search).toBe('?year=2026')
  })

  it('writes memoId for an id-scoped memo and budgetCategory next to it', () => {
    mountAt('/budget-visualizer/transactions')
    store.selectMemoView('WHOLEFDS', 12)
    store.setSelectedBudgetCategory('Food')
    expect(search().get('memoId')).toBe('12')
    expect(search().get('budgetCategory')).toBe('Food')
    expect(search().has('memoName')).toBe(false)
  })

  it('writes memoName when the memo has no id', () => {
    mountAt('/budget-visualizer/transactions')
    store.selectMemoView('WHOLEFDS', null)
    expect(search().get('memoName')).toBe('WHOLEFDS')
  })

  it('keeps unrelated query params', () => {
    mountAt('/budget-visualizer/transactions?tab=list')
    store.selectMonthView('03-2026')
    expect(search().get('tab')).toBe('list')
    expect(search().get('month')).toBe('03-2026')
  })

  it('moves filters off a month/week summary route back to the transactions list', () => {
    mountAt('/budget-visualizer/transactions/months/03-2026/summary')
    store.selectWeekView('09-2026')
    expect(loc.pathname).toBe('/budget-visualizer/transactions')
    expect(loc.search).toBe('?week=09-2026')
  })

  it('does not navigate on mount when the URL already matches the store', () => {
    mountAt('/budget-visualizer/transactions?month=03-2026')
    expect(navigate).not.toHaveBeenCalled()
  })
})
