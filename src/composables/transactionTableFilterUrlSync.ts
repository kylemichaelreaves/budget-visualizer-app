import { createEffect, on } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import {
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  selectMemoView,
  selectMemoFilterByIdOnly,
  clearAllFilters,
  transactionsState,
} from '@stores/transactionsStore'

/** Query keys written by `syncUrlFromStore`; keep in sync with filter UI. */
export const TRANSACTION_TABLE_FILTER_URL_PARAMS = [
  'day',
  'week',
  'month',
  'year',
  'memoId',
  'memoName',
  /** Legacy alias; migrated to `memoId` or `memoName` and dropped from the URL. */
  'memo',
] as const

function isBareTransactionsRoute(pathname: string): boolean {
  return /\/transactions\/?$/.test(pathname)
}

/** Month/week summary routes embed the period in the path; filter query strings belong on the main transactions list. */
const TRANSACTIONS_SUMMARY_FILTER_PATH = /\/transactions\/(?:months|weeks)\/[^/]+\/summary\/?$/

function pathForTransactionFilterSync(pathname: string): string {
  if (TRANSACTIONS_SUMMARY_FILTER_PATH.test(pathname)) {
    return pathname.replace(TRANSACTIONS_SUMMARY_FILTER_PATH, '/transactions')
  }
  return pathname
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
  /** Skip the next URL→store pass — it only reflects `syncUrlFromStore`’s own `navigate`, not a real navigation. */
  let skipOneUrlToStoreApply = false

  /** Reject NaN, non-positive IDs (memo ids are positive; `0` does not enable `useMemoById`). */
  function memoIdQueryParamInvalid(raw: string | null): boolean {
    if (raw == null || raw === '') return false
    const n = Number(raw)
    return !Number.isFinite(n) || n <= 0
  }

  function applyUrlParamsToStore() {
    if (pushingStoreToUrl) return
    if (skipOneUrlToStoreApply) {
      skipOneUrlToStoreApply = false
      return
    }

    const sp = new URLSearchParams(loc.search)

    /** Legacy `?memo=` deep links → canonical `memoId` / `memoName`; strip `memo` so it does not linger. */
    const legacyMemoParam = sp.get('memo')
    if (legacyMemoParam !== null) {
      sp.delete('memo')
      const hasTimeframe = !!(sp.get('day') || sp.get('week') || sp.get('month') || sp.get('year'))
      const existingMemoId = sp.get('memoId')
      const hasMemoId = existingMemoId != null && existingMemoId !== ''
      const existingMemoName = (sp.get('memoName') ?? '').trim()
      if (!hasTimeframe && !hasMemoId && !existingMemoName) {
        const t = legacyMemoParam.trim()
        if (t) {
          const n = Number(t)
          if (Number.isFinite(n) && n > 0 && String(n) === t) sp.set('memoId', String(n))
          else sp.set('memoName', t)
        }
      }
      const nextQs = sp.toString()
      const curQs = (loc.search ?? '').replace(/^\?/, '')
      if (nextQs !== curQs) {
        pushingStoreToUrl = true
        try {
          navigate(`${loc.pathname}${nextQs ? `?${nextQs}` : ''}`, { replace: true })
        } finally {
          pushingStoreToUrl = false
        }
        return
      }
    }

    const memoIdRaw = sp.get('memoId')
    if (memoIdQueryParamInvalid(memoIdRaw)) {
      sp.delete('memoId')
      const hasTimeframe = !!(sp.get('day') || sp.get('week') || sp.get('month') || sp.get('year'))
      const memoNameLeft = (sp.get('memoName') ?? '').trim()
      if (!hasTimeframe && !memoNameLeft && isBareTransactionsRoute(loc.pathname)) {
        hydratingFromUrl = true
        try {
          clearAllFilters()
        } finally {
          hydratingFromUrl = false
        }
      }
      const qs = sp.toString()
      pushingStoreToUrl = true
      try {
        navigate(`${loc.pathname}${qs ? `?${qs}` : ''}`, { replace: true })
      } finally {
        pushingStoreToUrl = false
      }
      return
    }

    const day = sp.get('day')
    const week = sp.get('week')
    const month = sp.get('month')
    const year = sp.get('year')
    const memoIdParam = sp.get('memoId')
    const memoNameParam = (sp.get('memoName') ?? '').trim()

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
      const hasMemoId = memoIdParam != null && memoIdParam !== ''
      if (memoNameParam && !hasMemoId) {
        selectMemoView(memoNameParam, null)
        return
      }
      if (!hasMemoId && !memoNameParam && isBareTransactionsRoute(loc.pathname)) {
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

  function urlHasTimeframeParam(): boolean {
    const sp = new URLSearchParams(loc.search)
    return !!(sp.get('day') || sp.get('week') || sp.get('month') || sp.get('year'))
  }

  const memoIdFromUrl = () => {
    const sp = new URLSearchParams(loc.search)
    const raw = sp.get('memoId')
    if (!raw) return null
    const n = Number(raw)
    if (!Number.isFinite(n) || n <= 0) return null
    return n
  }

  /** Set `selectedMemoId` immediately so memo-scoped queries match the URL before `useMemoById` resolves the name. */
  createEffect(
    on(
      () => [memoIdFromUrl(), loc.search] as const,
      () => {
        if (urlHasTimeframeParam()) return
        const id = memoIdFromUrl()
        if (id == null) return
        if (transactionsState.selectedMemoId === id && transactionsState.viewMode === 'memo') return
        selectMemoFilterByIdOnly(id)
      },
    ),
  )

  const memoFromUrl = useMemoById({ memoId: () => memoIdFromUrl() })

  /** Do not override day/week/month/year selection when both memoId and a timeframe appear in the URL. */
  createEffect(
    on(
      () => memoFromUrl.data,
      (memo) => {
        if (urlHasTimeframeParam()) return
        if (memo?.name) {
          if (
            transactionsState.viewMode === 'memo' &&
            transactionsState.selectedMemoId === memo.id &&
            transactionsState.selectedMemo === memo.name
          ) {
            return
          }
          selectMemoView(memo.name, memo.id)
        }
      },
      { defer: true },
    ),
  )

  function syncUrlFromStore() {
    if (hydratingFromUrl) return
    const sp = new URLSearchParams(loc.search)
    for (const key of TRANSACTION_TABLE_FILTER_URL_PARAMS) sp.delete(key)

    if (transactionsState.selectedDay) sp.set('day', transactionsState.selectedDay)
    else if (transactionsState.selectedWeek) sp.set('week', transactionsState.selectedWeek)
    else if (transactionsState.selectedMonth) sp.set('month', transactionsState.selectedMonth)
    else if (transactionsState.selectedYear) sp.set('year', transactionsState.selectedYear)
    else if (transactionsState.selectedMemoId != null && transactionsState.selectedMemoId > 0)
      sp.set('memoId', String(transactionsState.selectedMemoId))
    else if (transactionsState.viewMode === 'memo') {
      const name = transactionsState.selectedMemo.trim()
      if (name) sp.set('memoName', name)
    }

    const qs = sp.toString()
    const nextSearch = qs ? `?${qs}` : ''
    const currentSearch = loc.search ?? ''
    const path = pathForTransactionFilterSync(loc.pathname)
    if (nextSearch === currentSearch && path === loc.pathname) return

    pushingStoreToUrl = true
    skipOneUrlToStoreApply = true
    try {
      navigate(`${path}${nextSearch}`, { replace: true })
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
        transactionsState.selectedMemo,
        transactionsState.viewMode,
      ],
      () => syncUrlFromStore(),
      { defer: true },
    ),
  )
}
