import { createEffect, on } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import {
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  selectMemoView,
  clearAllFilters,
  transactionsState,
} from '@stores/transactionsStore'

/** Query keys written by `syncUrlFromStore`; keep in sync with filter UI. */
export const TRANSACTION_TABLE_FILTER_URL_PARAMS = ['day', 'week', 'month', 'year', 'memoId'] as const

function isBareTransactionsRoute(pathname: string): boolean {
  return /\/transactions\/?$/.test(pathname)
}

/**
 * Keeps transactions table timeframe/memo filters in sync with the URL:
 * - Reacts to `loc.search` / `loc.pathname` (back/forward, deep links)
 * - memoId → memo fetch → store
 * - store changes → replaceState on current path with normalized query
 */
export function useTransactionTableFilterUrlSync(): void {
  const loc = useLocation()
  const navigate = useNavigate()

  /** True while applying query params → store (avoids store→URL fighting URL→store). */
  let hydratingFromUrl = false
  /** True while store→URL navigation is in flight (skips URL→store re-entry). */
  let pushingStoreToUrl = false

  function applyUrlParamsToStore() {
    if (pushingStoreToUrl) return
    const sp = new URLSearchParams(loc.search)
    const day = sp.get('day')
    const week = sp.get('week')
    const month = sp.get('month')
    const year = sp.get('year')
    const memoIdParam = sp.get('memoId')

    hydratingFromUrl = true
    try {
      if (day) {
        selectDayView(day)
        return
      }
      if (week) {
        selectWeekView(week)
        return
      }
      if (month) {
        selectMonthView(month)
        return
      }
      if (year) {
        selectYearView(year)
        return
      }
      if (!memoIdParam && isBareTransactionsRoute(loc.pathname)) {
        clearAllFilters()
      }
    } finally {
      hydratingFromUrl = false
    }
  }

  createEffect(
    on(
      () => [loc.search, loc.pathname] as const,
      () => {
        applyUrlParamsToStore()
      },
    ),
  )

  const memoIdFromUrl = () => {
    const sp = new URLSearchParams(loc.search)
    const raw = sp.get('memoId')
    if (!raw) return null
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }

  const memoFromUrl = useMemoById({ memoId: () => memoIdFromUrl() })

  createEffect(
    on(
      () => memoFromUrl.data,
      (memo) => {
        if (memo?.name) {
          selectMemoView(memo.name, memo.id)
        }
      },
      { defer: true },
    ),
  )

  function syncUrlFromStore() {
    if (hydratingFromUrl) return
    pushingStoreToUrl = true
    try {
      const sp = new URLSearchParams(loc.search)
      for (const key of TRANSACTION_TABLE_FILTER_URL_PARAMS) sp.delete(key)

      if (transactionsState.selectedDay) sp.set('day', transactionsState.selectedDay)
      else if (transactionsState.selectedWeek) sp.set('week', transactionsState.selectedWeek)
      else if (transactionsState.selectedMonth) sp.set('month', transactionsState.selectedMonth)
      else if (transactionsState.selectedYear) sp.set('year', transactionsState.selectedYear)
      else if (transactionsState.selectedMemoId != null)
        sp.set('memoId', String(transactionsState.selectedMemoId))

      const qs = sp.toString()
      navigate(`${loc.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
    } finally {
      pushingStoreToUrl = false
    }
  }

  createEffect(
    on(
      () => [
        transactionsState.selectedDay,
        transactionsState.selectedWeek,
        transactionsState.selectedMonth,
        transactionsState.selectedYear,
        transactionsState.selectedMemoId,
      ],
      () => syncUrlFromStore(),
      { defer: true },
    ),
  )
}
