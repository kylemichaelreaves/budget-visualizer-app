import { flush } from 'solid-js'
import { describe, expect, it, beforeEach } from 'vitest'
import { transactionQueryScopeFromStore } from '@composables/transactionQueryScopeFromStore'
import { transactionsState, setTransactionsState, clearAllFilters } from '@stores/transactionsStore'
import { Timeframe } from '@types'

describe('transactionQueryScopeFromStore', () => {
  beforeEach(() => {
    clearAllFilters()
    flush()
  })

  it('omits timeframe and date when no period filter is active', () => {
    setTransactionsState((s) => {
      Object.assign(s, { viewMode: 'memo', selectedMemo: 'Coffee', selectedMemoId: 1 })
    })
    flush()
    expect(transactionQueryScopeFromStore()).toEqual({ timeFrame: undefined, date: undefined })
  })

  it('returns day scope when day filter is set', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedDay: '2024-01-15', viewMode: 'day' })
    })
    flush()
    expect(transactionQueryScopeFromStore()).toEqual({
      timeFrame: Timeframe.Day,
      date: '2024-01-15',
    })
  })

  it('returns week scope when week filter is set', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedWeek: '03-2024', viewMode: 'week' })
    })
    flush()
    expect(transactionQueryScopeFromStore()).toEqual({ timeFrame: Timeframe.Week, date: '03-2024' })
  })

  it('returns year scope only when year value is non-empty', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedYear: '2024', viewMode: 'year' })
    })
    flush()
    expect(transactionQueryScopeFromStore()).toEqual({
      timeFrame: Timeframe.Year,
      date: '2024',
    })
    setTransactionsState((s) => {
      Object.assign(s, { selectedYear: '', viewMode: null })
    })
    flush()
    expect(transactionsState.selectedYear).toBe('')
    expect(transactionQueryScopeFromStore()).toEqual({ timeFrame: undefined, date: undefined })
  })
})
