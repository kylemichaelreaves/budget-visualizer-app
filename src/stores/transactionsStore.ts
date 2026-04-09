import { batch } from 'solid-js'
import { createStore } from 'solid-js/store'
import type {
  DayYear,
  Memo,
  MonthYear,
  PendingTransaction,
  SummaryTypeBase,
  Summaries,
  Transaction,
  ViewMode,
  WeekYear,
  Year,
} from '@types'

export type TransactionsState = {
  selectedDay: string
  selectedMonth: string
  selectedYear: string
  selectedMemo: string
  selectedMemoId: number | null
  selectedWeek: string
  selectedType: string
  selectedBudgetCategory: string | null
  selectedDescription: string
  selectedStatus: 'pending' | 'reviewed'
  viewMode: ViewMode
  days: DayYear[]
  daysForSelectedWeek: string[]
  weeksForSelectedMonth: string[]
  weeks: WeekYear[]
  months: MonthYear[]
  memos: Memo[]
  years: Year[]
  descriptions: string[]
  OFSummaries: SummaryTypeBase[]
  MJSummaries: SummaryTypeBase[]
  daysSummaries: Summaries[]
  weeksSummaries: Summaries[]
  monthsSummaries: Summaries[]
  transactionsCurrentPage: number
  transactionsPageSize: number
  filter: Record<string, string>
  sort: { prop: string; order: string }
  memosTableLimit: number
  memosTableOffset: number
  memosByOffset: Record<number, Memo[]>
  transactionsTableLimit: number
  transactionsTableOffset: number
  transactions: Transaction[]
  transactionsCount: number
  memosCount: number
  pendingTransactionsByOffset: Record<number, PendingTransaction[]>
  pendingTransactionsCount: number
}

const initial: TransactionsState = {
  selectedDay: '',
  selectedMonth: '',
  selectedYear: '',
  selectedMemo: '',
  selectedMemoId: null,
  selectedWeek: '',
  selectedType: 'Amount Debit',
  selectedBudgetCategory: '',
  selectedDescription: '',
  selectedStatus: 'pending',
  viewMode: null,
  days: [],
  daysForSelectedWeek: [],
  weeksForSelectedMonth: [],
  weeks: [],
  months: [],
  memos: [],
  years: [],
  descriptions: [],
  OFSummaries: [],
  MJSummaries: [],
  daysSummaries: [],
  weeksSummaries: [],
  monthsSummaries: [],
  transactionsCurrentPage: 1,
  transactionsPageSize: 100,
  filter: {},
  sort: { prop: '', order: '' },
  memosTableLimit: 100,
  memosTableOffset: 0,
  memosByOffset: {},
  transactionsTableLimit: 100,
  transactionsTableOffset: 0,
  transactions: [],
  transactionsCount: 0,
  memosCount: 0,
  pendingTransactionsByOffset: {},
  pendingTransactionsCount: 0,
}

export const [transactionsState, setTransactionsState] = createStore<TransactionsState>({ ...initial })

export function getMemosByOffset(offset: number): Memo[] {
  return transactionsState.memosByOffset[offset] ?? []
}

export function setMemosByOffset(offset: number, rows: Memo[]): void {
  setTransactionsState('memosByOffset', offset, rows)
}

export function clearMemosByOffset(): void {
  setTransactionsState('memosByOffset', {})
}

export function setMemosCount(count: number): void {
  setTransactionsState('memosCount', count)
}

export function setMemosTableLimit(limit: number): void {
  setTransactionsState('memosTableLimit', limit)
}

export function updateMemosTableOffset(offset: number): void {
  setTransactionsState('memosTableOffset', offset)
}

export function getPendingTransactionsByOffset(offset: number): PendingTransaction[] {
  return transactionsState.pendingTransactionsByOffset[offset] ?? []
}

export function clearSelectionForSummary(): void {
  setTransactionsState({
    selectedDay: '',
    selectedWeek: '',
    selectedMonth: '',
    selectedYear: '',
    selectedMemo: '',
    selectedMemoId: null,
  })
}

export function clearSelectionForPending(): void {
  setTransactionsState({
    selectedDay: '',
    selectedWeek: '',
    selectedMonth: '',
    selectedYear: '',
    selectedMemo: '',
    selectedMemoId: null,
  })
}

export function setViewMode(mode: ViewMode): void {
  setTransactionsState('viewMode', mode)
}

function clearAllSelections(): void {
  setTransactionsState({
    selectedDay: '',
    selectedWeek: '',
    selectedMonth: '',
    selectedYear: '',
    selectedMemo: '',
    selectedMemoId: null,
    transactionsTableOffset: 0,
  })
}

export function selectDayView(day: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedDay: day, viewMode: 'day' })
  })
}

export function selectWeekView(week: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedWeek: week, viewMode: 'week' })
  })
}

export function selectMonthView(month: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedMonth: month, viewMode: 'month' })
  })
}

export function selectYearView(year: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedYear: year, viewMode: 'year' })
  })
}

export function selectMemoView(memo: string, memoId?: number | null): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedMemo: memo, selectedMemoId: memoId ?? null, viewMode: 'memo' })
  })
}

export function clearAllFilters(): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState('viewMode', null)
  })
}

export function applyMonthSummaryRoute(month: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedMonth: month, viewMode: 'month' })
  })
}

export function applyWeekSummaryRoute(week: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedWeek: week, viewMode: 'week' })
  })
}

export function applyMemoSummaryRoute(memoId: string): void {
  batch(() => {
    clearAllSelections()
    setTransactionsState({ selectedMemoId: Number(memoId), viewMode: 'memo' })
  })
}

export function setSelectedDay(day: string): void {
  setTransactionsState('selectedDay', day)
}
export function setSelectedMonth(month: string): void {
  setTransactionsState('selectedMonth', month)
}
export function setSelectedMemo(memo: string, memoId?: number | null): void {
  setTransactionsState('selectedMemo', memo)
  if (memoId !== undefined) setTransactionsState('selectedMemoId', memoId ?? null)
}
export function setSelectedWeek(week: string): void {
  setTransactionsState('selectedWeek', week)
}
export function setSelectedYear(year: string): void {
  setTransactionsState('selectedYear', year)
}
export function setMonths(monthsArray: MonthYear[]): void {
  setTransactionsState('months', monthsArray)
}
export function setTransactionsCount(count: number): void {
  setTransactionsState('transactionsCount', count)
}
export function setTransactionsTableLimit(limit: number): void {
  setTransactionsState('transactionsTableLimit', limit)
}
export function updateTransactionsTableOffset(offset: number): void {
  setTransactionsState('transactionsTableOffset', offset)
}
export function updateTransactionsPageSize(pageSize: number): void {
  setTransactionsState('transactionsPageSize', pageSize)
}

export function setSelectedStatus(status: 'pending' | 'reviewed'): void {
  setTransactionsState('selectedStatus', status)
}

export function setPendingTransactionsByOffset(offset: number, rows: PendingTransaction[]): void {
  setTransactionsState('pendingTransactionsByOffset', offset, rows)
}

export function clearPendingTransactionsByOffset(): void {
  setTransactionsState('pendingTransactionsByOffset', {})
}

export function setDaysForSelectedWeek(days: string[]): void {
  setTransactionsState('daysForSelectedWeek', days)
}

export function setWeeks(weeks: WeekYear[]): void {
  setTransactionsState('weeks', weeks)
}

export function setWeeksForSelectedMonth(weeks: string[]): void {
  setTransactionsState('weeksForSelectedMonth', weeks)
}

export function setDays(days: DayYear[]): void {
  setTransactionsState('days', days)
}

export function setYears(years: Year[]): void {
  setTransactionsState('years', years)
}
