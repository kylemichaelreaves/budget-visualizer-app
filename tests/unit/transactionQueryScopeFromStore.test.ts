import { describe, expect, it, beforeEach } from 'vitest'
import {
  transactionQueryScopeFromStore,
  resolveTransactionDateFromStore,
  resolveTransactionTimeframeFromStore,
} from '@composables/transactionQueryScopeFromStore'
import { transactionsState, setTransactionsState, clearAllFilters } from '@stores/transactionsStore'
import { Timeframe } from '@types'

describe('transactionQueryScopeFromStore', () => {
  beforeEach(() => {
    clearAllFilters()
  })

  it('omits timeframe and date when no period filter is active', () => {
    setTransactionsState({ viewMode: 'memo', selectedMemo: 'Coffee', selectedMemoId: 1 })
    expect(transactionQueryScopeFromStore()).toEqual({ timeFrame: undefined, date: undefined })
  })

  it('returns day scope when day filter is set', () => {
    setTransactionsState({ selectedDay: '2024-01-15', viewMode: 'day' })
    expect(transactionQueryScopeFromStore()).toEqual({
      timeFrame: Timeframe.Day,
      date: '2024-01-15',
    })
  })

  it('returns week scope when week filter is set', () => {
    setTransactionsState({ selectedWeek: '03-2024', viewMode: 'week' })
    expect(resolveTransactionTimeframeFromStore()).toBe(Timeframe.Week)
    expect(resolveTransactionDateFromStore()).toBe('03-2024')
  })

  it('returns year scope only when year value is non-empty', () => {
    setTransactionsState({ selectedYear: '2024', viewMode: 'year' })
    expect(transactionQueryScopeFromStore()).toEqual({
      timeFrame: Timeframe.Year,
      date: '2024',
    })
    setTransactionsState({ selectedYear: '', viewMode: null })
    expect(transactionsState.selectedYear).toBe('')
    expect(transactionQueryScopeFromStore()).toEqual({ timeFrame: undefined, date: undefined })
  })
})
