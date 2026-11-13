import { httpClient } from '@api/httpClient'
import type { BudgetCategorySummary, SummaryTypeBase, Transaction, TransactionQueryParams } from '@types'
import { isValidParam } from '@api/helpers/isValidParam'

/**
 * `GET /transactions` serves several response shapes, chosen by a mode flag.
 * Each mode gets its own typed fetcher below so callers never cast `any`.
 */
type ModeFlag =
  | 'count'
  | 'summary'
  | 'summaryType'
  | 'totalAmountDebit'
  | 'budgetCategorySummary'
  | 'budgetCategoryHierarchySum'

/** Filters shared by every mode. */
export type TransactionFilters = Omit<TransactionQueryParams, ModeFlag | 'limit' | 'offset'>

async function getTransactions<T>(params: TransactionQueryParams): Promise<T> {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([key, value]) => isValidParam(key, value)),
  )
  const response = await httpClient.get<T>('/transactions', { params: filtered })
  return response.data
}

/** One page of transaction rows. */
export function fetchTransactions(
  params: TransactionFilters & Pick<TransactionQueryParams, 'limit' | 'offset'>,
): Promise<Transaction[]> {
  return getTransactions<Transaction[]>(params)
}

/**
 * Row count for the filter (or for `pending_transactions` when `status` is set).
 * pg `COUNT(*)` without `::int` arrives as a string, so it is coerced here.
 */
export async function fetchTransactionsCount(params: TransactionFilters = {}): Promise<number> {
  const rows = await getTransactions<{ count: number | string }[]>({ ...params, count: true })
  return Number(rows[0]?.count ?? 0)
}

/** Debit totals per budget category, rolled up the category tree. */
export function fetchBudgetCategoryHierarchySum(
  params: TransactionFilters,
): Promise<BudgetCategorySummary[]> {
  return getTransactions<BudgetCategorySummary[]>({ ...params, budgetCategoryHierarchySum: true })
}

/** One budget category's debit total per period, for its line chart. */
export function fetchHistoricalSummary(params: TransactionFilters): Promise<SummaryTypeBase[]> {
  return getTransactions<SummaryTypeBase[]>({ ...params, summary: true, summaryType: 'historical' })
}

/** Debit/credit totals; the shape varies, so `normalizeTransactionTotals` parses it. */
export function fetchTransactionTotals(params: TransactionFilters): Promise<unknown> {
  return getTransactions<unknown>({ ...params, totalAmountDebit: true })
}

/** Flat per-category debit totals; `normalizeCategoryTotals` parses the shape. */
export function fetchCategoryTotals(params: TransactionFilters): Promise<unknown> {
  return getTransactions<unknown>({ ...params, budgetCategorySummary: true })
}
