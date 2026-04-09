import { createEffect, on, onMount } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import {
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  selectMemoView,
  transactionsState,
} from '@stores/transactionsStore'

/** Query keys written by `syncUrlFromStore`; keep in sync with filter UI. */
export const TRANSACTION_TABLE_FILTER_URL_PARAMS = ['day', 'week', 'month', 'year', 'memoId'] as const

/**
 * Keeps transactions table timeframe/memo filters in sync with the URL:
 * - initial read of day/week/month/year on mount
 * - memoId → memo fetch → store
 * - store changes → replaceState on current path with normalized query
 */
export function useTransactionTableFilterUrlSync(): void {
  const loc = useLocation()
  const navigate = useNavigate()

  onMount(() => {
    const sp = new URLSearchParams(loc.search)
    const day = sp.get('day')
    const week = sp.get('week')
    const month = sp.get('month')
    const year = sp.get('year')
    if (day) selectDayView(day)
    else if (week) selectWeekView(week)
    else if (month) selectMonthView(month)
    else if (year) selectYearView(year)
  })

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
        if (memo?.name) selectMemoView(memo.name, memo.id)
      },
      { defer: true },
    ),
  )

  function syncUrlFromStore() {
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
