import { createEffect, on } from 'solid-js'
import { useLocation, useNavigate } from '@solidjs/router'
import { useMemoById } from '@api/hooks/memos/useMemoById'
import {
  TRANSACTION_TABLE_FILTER_URL_PARAMS,
  applyLegacyMemoParamMigration,
  isBareTransactionsRoute,
  memoIdQueryParamInvalid,
  pathForTransactionFilterSync,
} from '@composables/transactionFilterUrlHelpers'
import {
  selectDayView,
  selectWeekView,
  selectMonthView,
  selectYearView,
  selectMemoView,
  selectMemoFilterByIdOnly,
  setSelectedBudgetCategory,
  clearAllFilters,
  transactionsState,
} from '@stores/transactionsStore'

export { TRANSACTION_TABLE_FILTER_URL_PARAMS } from '@composables/transactionFilterUrlHelpers'

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

  function applyUrlParamsToStore() {
    if (pushingStoreToUrl) return
    if (skipOneUrlToStoreApply) {
      skipOneUrlToStoreApply = false
      return
    }

    const sp = new URLSearchParams(loc.search)

    /** Legacy `?memo=` deep links → canonical `memoId` / `memoName`; strip `memo` so it does not linger. */
    if (sp.get('memo') !== null) {
      applyLegacyMemoParamMigration(sp)
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
    const budgetCategoryParam = (sp.get('budgetCategory') ?? '').trim() || null

    hydratingFromUrl = true
    try {
      setSelectedBudgetCategory(budgetCategoryParam)

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

    if (transactionsState.selectedBudgetCategory)
      sp.set('budgetCategory', transactionsState.selectedBudgetCategory)

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
        transactionsState.selectedBudgetCategory,
      ],
      () => syncUrlFromStore(),
      { defer: true },
    ),
  )
}
