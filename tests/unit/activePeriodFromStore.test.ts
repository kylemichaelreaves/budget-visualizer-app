import { flush } from 'solid-js'
import { beforeEach, describe, expect, it } from 'vitest'
import { activePeriodFromStore, urlHasTimeframe } from '@composables/activePeriodFromStore'
import { transactionQueryScopeFromStore } from '@composables/transactionQueryScopeFromStore'
import {
  clearAllFilters,
  selectMemoView,
  selectMonthView,
  setTransactionsState,
} from '@stores/transactionsStore'
import { Timeframe } from '@types'

describe('activePeriodFromStore', () => {
  beforeEach(() => {
    clearAllFilters()
    flush()
  })

  it('returns null with no period selected', () => {
    expect(activePeriodFromStore()).toBeNull()
  })

  it('returns null under a memo filter', () => {
    selectMemoView('Coffee', 7)
    flush()
    expect(activePeriodFromStore()).toBeNull()
  })

  it('follows a store selector', () => {
    selectMonthView('03-2026')
    flush()
    expect(activePeriodFromStore()).toEqual({ timeframe: Timeframe.Month, value: '03-2026' })
  })

  // The case the three old copies disagreed on: two periods set at once. The
  // table used month (day > week > month > year) while the charts paired a Year
  // timeframe with the year value only when viewMode said so.
  it('lets viewMode pick between two set periods', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedMonth: '03-2026', selectedYear: '2026', viewMode: 'year' })
    })
    flush()
    expect(activePeriodFromStore()).toEqual({ timeframe: Timeframe.Year, value: '2026' })
    setTransactionsState((s) => {
      Object.assign(s, { viewMode: 'month' })
    })
    flush()
    expect(activePeriodFromStore()).toEqual({ timeframe: Timeframe.Month, value: '03-2026' })
  })

  it('falls back to the finest grain when viewMode names no period', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedWeek: '11-2026', selectedYear: '2026', viewMode: null })
    })
    flush()
    expect(activePeriodFromStore()).toEqual({ timeframe: Timeframe.Week, value: '11-2026' })
  })

  it('falls back when viewMode names a period with no value', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedYear: '2026', viewMode: 'day' })
    })
    flush()
    expect(activePeriodFromStore()).toEqual({ timeframe: Timeframe.Year, value: '2026' })
  })

  it('ignores a whitespace-only value', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedYear: '  ', viewMode: 'year' })
    })
    flush()
    expect(activePeriodFromStore()).toBeNull()
  })

  it('is what the transaction query scope reads', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedMonth: '03-2026', selectedYear: '2026', viewMode: 'year' })
    })
    flush()
    expect(transactionQueryScopeFromStore()).toEqual({ timeFrame: Timeframe.Year, date: '2026' })
  })
})

describe('urlHasTimeframe', () => {
  it.each(['day=2026-03-14', 'week=11-2026', 'month=03-2026', 'year=2026', 'memoId=3&year=2026'])(
    'is true for %s',
    (qs) => {
      expect(urlHasTimeframe(new URLSearchParams(qs))).toBe(true)
    },
  )

  it.each(['', 'memoId=3', 'memoName=Coffee&budgetCategory=Food', 'year=', 'day='])(
    'is false for %j',
    (qs) => {
      expect(urlHasTimeframe(new URLSearchParams(qs))).toBe(false)
    },
  )
})
