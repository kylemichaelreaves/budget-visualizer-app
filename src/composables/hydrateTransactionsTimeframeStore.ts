import { createEffect, on } from 'solid-js'
import { setDays, setMonths, setWeeks, setYears } from '@stores/transactionsStore'
import type { DayYear, MonthYear, WeekYear, Year } from '@types'

type TimeframeListQuery<T> = { readonly data: T | undefined }

/**
 * Mirrors timeframe list query results into `transactionsState` so period
 * navigation and other readers share the same cached lists.
 */
export function useHydrateTransactionsTimeframeStoreFromQueries(q: {
  yearsQ: TimeframeListQuery<Year[]>
  monthsQ: TimeframeListQuery<MonthYear[]>
  weeksQ: TimeframeListQuery<WeekYear[]>
  daysQ: TimeframeListQuery<DayYear[]>
}): void {
  createEffect(
    on(
      () => q.yearsQ.data,
      (data) => {
        if (data) setYears(data)
      },
    ),
  )
  createEffect(
    on(
      () => q.monthsQ.data,
      (data) => {
        if (data) setMonths(data)
      },
    ),
  )
  createEffect(
    on(
      () => q.weeksQ.data,
      (data) => {
        if (data) setWeeks(data)
      },
    ),
  )
  createEffect(
    on(
      () => q.daysQ.data,
      (data) => {
        if (data) setDays(data)
      },
    ),
  )
}
