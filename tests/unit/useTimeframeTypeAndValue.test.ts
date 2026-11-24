import { createRoot, flush } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import useTimeframeTypeAndValue from '@composables/useTimeframeTypeAndValue'
import {
  clearAllFilters,
  selectDayView,
  selectMemoView,
  selectMonthView,
  selectWeekView,
  setTransactionsState,
} from '@stores/transactionsStore'
import { Timeframe } from '@types'

describe('useTimeframeTypeAndValue', () => {
  let dispose: () => void
  let view: ReturnType<typeof useTimeframeTypeAndValue>

  beforeEach(() => {
    clearAllFilters()
    flush()
    createRoot((d) => {
      dispose = d
      view = useTimeframeTypeAndValue()
    })
  })
  afterEach(() => {
    dispose()
    clearAllFilters()
    flush()
  })

  it('is unscoped (Year, no value) when no period is selected', () => {
    expect(view.timeFrame()).toBe(Timeframe.Year)
    expect(view.selectedValue()).toBeUndefined()
  })

  it('is unscoped under a memo filter', () => {
    selectMemoView('Coffee', 7)
    flush()
    expect(view.timeFrame()).toBe(Timeframe.Year)
    expect(view.selectedValue()).toBeUndefined()
  })

  it('tracks the selected period reactively', () => {
    selectMonthView('03-2026')
    flush()
    expect(view.timeFrame()).toBe(Timeframe.Month)
    expect(view.selectedValue()).toBe('03-2026')

    selectWeekView('11-2026')
    flush()
    expect(view.timeFrame()).toBe(Timeframe.Week)
    expect(view.selectedValue()).toBe('11-2026')

    selectDayView('2026-03-05')
    flush()
    expect(view.timeFrame()).toBe(Timeframe.Day)
    expect(view.selectedValue()).toBe('2026-03-05')
  })

  // Same resolution as the table query: viewMode wins when it names a set period.
  it('follows viewMode when two periods are set at once', () => {
    setTransactionsState((s) => {
      Object.assign(s, { selectedMonth: '03-2026', selectedYear: '2026', viewMode: 'year' })
    })
    flush()
    expect(view.timeFrame()).toBe(Timeframe.Year)
    expect(view.selectedValue()).toBe('2026')
  })
})
