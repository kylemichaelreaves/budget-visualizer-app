import { flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  applyMemoSummaryRoute,
  clearAllFilters,
  prepareTransactionsScrollRestoreFromViewport,
  selectDayView,
  selectMemoFilterByIdOnly,
  selectMemoView,
  setMemosTableLimit,
  setSelectedBudgetCategory,
  setSelectedStatus,
  setTransactionsTableLimit,
  setViewMode,
  syncMemoFromSummaryData,
  takeAndApplyPendingTransactionsScrollRestore,
  transactionsState as s,
  updateMemosTableOffset,
  updatePendingTableOffset,
  updateTransactionsTableOffset,
} from '@stores/transactionsStore'

// Solid 2 store writes go through draft setters and land on the next flush.

describe('transactionsStore', () => {
  beforeEach(() => {
    clearAllFilters()
    updateTransactionsTableOffset(0)
    flush()
  })

  it('sets the table sizes and offsets', () => {
    setMemosTableLimit(25)
    updateMemosTableOffset(50)
    setTransactionsTableLimit(10)
    updateTransactionsTableOffset(20)
    updatePendingTableOffset(30)
    setSelectedStatus('reviewed')
    setViewMode('month')
    flush()
    expect([s.memosTableLimit, s.memosTableOffset, s.transactionsTableLimit]).toEqual([25, 50, 10])
    expect([s.transactionsTableOffset, s.pendingTableOffset, s.selectedStatus, s.viewMode]).toEqual([
      20,
      30,
      'reviewed',
      'month',
    ])
  })

  it('selecting a view clears the other selections and the table offset', () => {
    selectMemoView('Coffee', 7)
    updateTransactionsTableOffset(40)
    flush()
    selectDayView('2026-03-14')
    flush()
    expect(s).toMatchObject({
      viewMode: 'day',
      selectedDay: '2026-03-14',
      selectedMemo: '',
      selectedMemoId: null,
      transactionsTableOffset: 0,
    })
  })

  it('scopes by memo id before the name loads, then keeps the offset when the name arrives', () => {
    selectMemoFilterByIdOnly(12)
    flush()
    expect(s).toMatchObject({ viewMode: 'memo', selectedMemo: '12', selectedMemoId: 12 })
    updateTransactionsTableOffset(100)
    flush()
    syncMemoFromSummaryData('WHOLEFDS', 12)
    flush()
    expect(s).toMatchObject({ selectedMemo: 'WHOLEFDS', transactionsTableOffset: 100 })
    syncMemoFromSummaryData('RENT', 13)
    flush()
    expect(s).toMatchObject({ selectedMemo: 'RENT', selectedMemoId: 13, transactionsTableOffset: 0 })
  })

  it.each([
    ['7', { viewMode: 'memo', selectedMemoId: 7, selectedMemo: '7' }],
    ['abc', { viewMode: null, selectedMemoId: null }],
  ])('applies the memo summary route %j', (id, expected) => {
    applyMemoSummaryRoute(id)
    flush()
    expect(s).toMatchObject(expected)
  })

  it('resets the page with a category change unless told not to', () => {
    updateTransactionsTableOffset(40)
    setSelectedBudgetCategory('Food', { resetTablePagination: false })
    flush()
    expect([s.selectedBudgetCategory, s.transactionsTableOffset]).toEqual(['Food', 40])
    setSelectedBudgetCategory('Rent')
    flush()
    expect([s.selectedBudgetCategory, s.transactionsTableOffset]).toEqual(['Rent', 0])
  })

  describe('scroll restore', () => {
    afterEach(() => {
      document.body.innerHTML = ''
      vi.restoreAllMocks()
    })

    it('scrolls to the anchored row when it is in the DOM, once', () => {
      document.body.innerHTML = '<div data-testid="transaction-row-5"></div>'
      const row = document.querySelector<HTMLElement>('[data-testid="transaction-row-5"]')!
      const intoView = vi.spyOn(row, 'scrollIntoView')
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      prepareTransactionsScrollRestoreFromViewport(5)
      takeAndApplyPendingTransactionsScrollRestore()
      takeAndApplyPendingTransactionsScrollRestore()
      expect(intoView).toHaveBeenCalledOnce()
      expect(scrollTo).not.toHaveBeenCalled()
    })

    it('falls back to the saved scroll position', () => {
      const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
      prepareTransactionsScrollRestoreFromViewport(99)
      takeAndApplyPendingTransactionsScrollRestore()
      expect(scrollTo).toHaveBeenCalledWith({ top: window.scrollY, left: 0, behavior: 'auto' })
    })
  })
})
