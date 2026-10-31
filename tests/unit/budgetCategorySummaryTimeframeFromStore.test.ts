import { createRoot, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createBudgetCategorySummaryTimeframeFromStore } from '@composables/budgetCategorySummaryTimeframeFromStore'
import {
  clearAllFilters,
  selectDayView,
  selectMemoView,
  selectMonthView,
  selectWeekView,
  selectYearView,
} from '@stores/transactionsStore'
import { Timeframe } from '@types'

type Resolved = ReturnType<typeof createBudgetCategorySummaryTimeframeFromStore>

let dispose: (() => void) | undefined

function mount(firstDay: () => string | undefined = () => undefined): Resolved {
  return createRoot((d) => {
    dispose = d
    return createBudgetCategorySummaryTimeframeFromStore(firstDay)
  })
}

const scope = (r: Resolved) => ({ timeFrame: r.chartTimeFrame(), date: r.chartDate() })

describe('createBudgetCategorySummaryTimeframeFromStore', () => {
  beforeEach(() => {
    clearAllFilters()
  })

  afterEach(() => {
    dispose?.()
    dispose = undefined
    vi.useRealTimers()
  })

  // The timeframe and the date go to the same request; a Year timeframe paired
  // with an MM-YYYY date would ask the server for the wrong period.
  it.each([
    ['day', () => selectDayView('2026-03-14'), Timeframe.Day, '2026-03-14'],
    ['week', () => selectWeekView('11-2026'), Timeframe.Week, '11-2026'],
    ['month', () => selectMonthView('03-2026'), Timeframe.Month, '03-2026'],
    ['year', () => selectYearView('2026'), Timeframe.Year, '2026'],
  ])('pairs the %s filter with its own value', (_name, select, timeFrame, date) => {
    const r = mount()
    select()
    expect(scope(r)).toEqual({ timeFrame, date })
  })

  it('follows the store when the filter changes after mount', () => {
    const r = mount()
    selectMonthView('03-2026')
    expect(scope(r)).toEqual({ timeFrame: Timeframe.Month, date: '03-2026' })
    selectDayView('2026-03-14')
    expect(scope(r)).toEqual({ timeFrame: Timeframe.Day, date: '2026-03-14' })
    selectYearView('2025')
    expect(scope(r)).toEqual({ timeFrame: Timeframe.Year, date: '2025' })
  })

  it('falls back to the month of the first transaction when no period is selected', () => {
    const r = mount(() => '2025-11-30')
    expect(scope(r)).toEqual({ timeFrame: Timeframe.Month, date: '11-2025' })
  })

  // `new Date('2026-03-01')` is UTC midnight, so a rewrite that formats it with
  // local getters would land in February in this suite's zone.
  it('reads the first-transaction month without shifting across a month boundary', () => {
    expect(mount(() => '2026-03-01').chartDate()).toBe('03-2026')
  })

  it('tracks a firstDay accessor that resolves after mount', () => {
    const [firstDay, setFirstDay] = createSignal<string | undefined>(undefined)
    vi.useFakeTimers({ now: new Date(2026, 9, 30, 12) })
    const r = mount(firstDay)
    expect(r.chartDate()).toBe('10-2026')
    setFirstDay('2024-06-15')
    expect(r.chartDate()).toBe('06-2024')
  })

  it('falls back to the current month when firstDay is missing or invalid', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 30, 12) })
    expect(mount(() => undefined).chartDate()).toBe('10-2026')
    dispose?.()
    expect(mount(() => 'not a date').chartDate()).toBe('10-2026')
  })

  // A memo filter carries no period, so the charts fall back to a month.
  it('uses the month fallback under a memo filter', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 30, 12) })
    const r = mount()
    selectMemoView('Coffee', 7)
    expect(scope(r)).toEqual({ timeFrame: Timeframe.Month, date: '10-2026' })
  })

  it('prefers a selected month over firstDay for the default month', () => {
    const r = mount(() => '2024-06-15')
    selectMonthView('03-2026')
    expect(r.defaultMonthForCharts()).toBe('03-2026')
  })
})
