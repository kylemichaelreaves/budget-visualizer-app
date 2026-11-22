import { createStore } from 'solid-js'
import type { PendingTransactionStatus, ViewMode } from '@types'

export type TransactionsState = {
  selectedDay: string
  selectedMonth: string
  selectedYear: string
  selectedMemo: string
  selectedMemoId: number | null
  selectedWeek: string
  selectedBudgetCategory: string | null
  selectedStatus: PendingTransactionStatus
  viewMode: ViewMode
  memosTableLimit: number
  memosTableOffset: number
  transactionsTableLimit: number
  transactionsTableOffset: number
  /** The pending table's own page; it shares the page size but not the offset. */
  pendingTableOffset: number
}

const initial: TransactionsState = {
  selectedDay: '',
  selectedMonth: '',
  selectedYear: '',
  selectedMemo: '',
  selectedMemoId: null,
  selectedWeek: '',
  selectedBudgetCategory: null,
  selectedStatus: 'pending',
  viewMode: null,
  memosTableLimit: 100,
  memosTableOffset: 0,
  transactionsTableLimit: 100,
  transactionsTableOffset: 0,
  pendingTableOffset: 0,
}

export const [transactionsState, setTransactionsState] = createStore<TransactionsState>({ ...initial })

export function setMemosTableLimit(limit: number): void {
  setTransactionsState((s) => {
    s.memosTableLimit = limit
  })
}

export function updateMemosTableOffset(offset: number): void {
  setTransactionsState((s) => {
    s.memosTableOffset = offset
  })
}

export function setViewMode(mode: ViewMode): void {
  setTransactionsState((s) => {
    s.viewMode = mode
  })
}

function clearAllSelections(): void {
  setTransactionsState((s) => {
    Object.assign(s, {
      selectedDay: '',
      selectedWeek: '',
      selectedMonth: '',
      selectedYear: '',
      selectedMemo: '',
      selectedMemoId: null,
      selectedBudgetCategory: null,
      transactionsTableOffset: 0,
    })
  })
}

export function selectDayView(day: string): void {
  clearAllSelections()
  setTransactionsState((s) => {
    Object.assign(s, { selectedDay: day, viewMode: 'day' })
  })
}

export function selectWeekView(week: string): void {
  clearAllSelections()
  setTransactionsState((s) => {
    Object.assign(s, { selectedWeek: week, viewMode: 'week' })
  })
}

export function selectMonthView(month: string): void {
  clearAllSelections()
  setTransactionsState((s) => {
    Object.assign(s, { selectedMonth: month, viewMode: 'month' })
  })
}

export function selectYearView(year: string): void {
  clearAllSelections()
  setTransactionsState((s) => {
    Object.assign(s, { selectedYear: year, viewMode: 'year' })
  })
}

export function selectMemoView(memo: string, memoId?: number | null): void {
  clearAllSelections()
  setTransactionsState((s) => {
    Object.assign(s, { selectedMemo: memo, selectedMemoId: memoId ?? null, viewMode: 'memo' })
  })
}

/**
 * When memo summary data loads: set `viewMode` + memo fields without resetting
 * `transactionsTableOffset` if we are already scoped to this memo (e.g. name hydrate
 * after `applyMemoSummaryRoute`). Otherwise full `selectMemoView` clears stray timeframe state.
 */
export function syncMemoFromSummaryData(memo: string, memoId: number): void {
  if (transactionsState.viewMode === 'memo' && transactionsState.selectedMemoId === memoId) {
    setTransactionsState((s) => {
      s.selectedMemo = memo
    })
    return
  }
  selectMemoView(memo, memoId)
}

/**
 * Apply memo filter from `memoId` URL param before the memo record loads.
 * `selectedMemoId` drives memo-scoped fetches (via `memoQuerySliceFromStore()`).
 * `selectedMemo` is set to the numeric string so the memo label in the UI, memo filter field,
 * and store→URL sync have a stable display value until `useMemoById` hydrates the real name.
 */
export function selectMemoFilterByIdOnly(memoId: number): void {
  clearAllSelections()
  setTransactionsState((s) => {
    Object.assign(s, {
      selectedMemo: String(memoId),
      selectedMemoId: memoId,
      viewMode: 'memo',
    })
  })
}

export function clearAllFilters(): void {
  clearAllSelections()
  setTransactionsState((s) => {
    s.viewMode = null
  })
}

export function applyMemoSummaryRoute(memoId: string): void {
  const n = Number(memoId)
  const valid = Number.isFinite(n) && n > 0
  clearAllSelections()
  if (valid) {
    setTransactionsState((s) => {
      Object.assign(s, { selectedMemo: String(n), selectedMemoId: n, viewMode: 'memo' })
    })
  } else {
    setTransactionsState((s) => {
      Object.assign(s, { selectedMemoId: null, viewMode: null })
    })
  }
}

export function setTransactionsTableLimit(limit: number): void {
  setTransactionsState((s) => {
    s.transactionsTableLimit = limit
  })
}
export function updateTransactionsTableOffset(offset: number): void {
  setTransactionsState((s) => {
    s.transactionsTableOffset = offset
  })
}

export function updatePendingTableOffset(offset: number): void {
  setTransactionsState((s) => {
    s.pendingTableOffset = offset
  })
}

type PendingTransactionsScrollRestore = {
  scrollY: number
  anchorTransactionId?: number
}

let pendingTransactionsScrollRestore: PendingTransactionsScrollRestore | null = null

/**
 * Call immediately before changing the budget category filter from a row pill.
 * After the query refetch, `takeAndApplyPendingTransactionsScrollRestore` runs in a render effect (before paint).
 */
export function prepareTransactionsScrollRestoreFromViewport(anchorTransactionId?: number): void {
  pendingTransactionsScrollRestore = {
    scrollY: window.scrollY,
    ...(anchorTransactionId != null ? { anchorTransactionId } : {}),
  }
}

/** Applies saved scroll / row anchor once, then clears. Prefer anchoring to the row when it is still in the DOM. */
export function takeAndApplyPendingTransactionsScrollRestore(): void {
  const p = pendingTransactionsScrollRestore
  pendingTransactionsScrollRestore = null
  if (!p) return

  const id = p.anchorTransactionId
  if (id != null) {
    const el = document.querySelector<HTMLElement>(`[data-testid="transaction-row-${id}"]`)
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      return
    }
  }
  window.scrollTo({ top: p.scrollY, left: 0, behavior: 'auto' })
}

export function setSelectedBudgetCategory(
  category: string | null,
  options?: { resetTablePagination?: boolean },
): void {
  const resetTablePagination = options?.resetTablePagination !== false
  setTransactionsState((s) => {
    s.selectedBudgetCategory = category
  })
  if (resetTablePagination) {
    setTransactionsState((s) => {
      s.transactionsTableOffset = 0
    })
  }
}

export function setSelectedStatus(status: PendingTransactionStatus): void {
  setTransactionsState((s) => {
    s.selectedStatus = status
  })
}
