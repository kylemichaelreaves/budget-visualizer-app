import type { TransactionQueryParams } from '@types'
import { memoQuerySliceFromStore } from '@composables/memoQueryFromTransactionsStore'
import { transactionQueryScopeFromStore } from '@composables/transactionQueryScopeFromStore'
import { transactionsState } from '@stores/transactionsStore'

export type TransactionTableScope = {
  /** Query-key segments, in the order `queryKeys.transactions.infinite` takes them after `limit`. */
  memoKey: string
  timeFrame: TransactionQueryParams['timeFrame']
  date: string | undefined
  budgetCategory: string | null
  /** The filter params every query describing the table's rows must send. */
  params: Pick<TransactionQueryParams, 'memoId' | 'memoName' | 'timeFrame' | 'date' | 'budgetCategory'>
}

/**
 * The filter the transactions table is showing: memo, period and budget category.
 *
 * The table rows and the summary cards above them both read this, so the cards'
 * server aggregates cover exactly the rows the table pages through. Before, the
 * cards' debit total used the chart's period instead, which falls back to a month
 * in memo view.
 */
export function transactionTableScopeFromStore(): TransactionTableScope {
  const { key: memoKey, params: memoParams } = memoQuerySliceFromStore()
  const { timeFrame, date } = transactionQueryScopeFromStore()
  const budgetCategory = transactionsState.selectedBudgetCategory
  return {
    memoKey,
    timeFrame,
    date,
    budgetCategory,
    params: {
      ...memoParams,
      ...(timeFrame && date ? { timeFrame, date } : {}),
      budgetCategory: budgetCategory ?? undefined,
    },
  }
}
