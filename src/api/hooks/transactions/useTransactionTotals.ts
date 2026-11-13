import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchTransactionTotals } from '@api/transactions/fetchTransactions'
import { normalizeTransactionTotals } from '@api/transactions/normalizeTransactionTotals'
import { transactionTableScopeFromStore } from '@composables/transactionTableScopeFromStore'

/** Debit/credit totals and counts over every row the transactions table's filter matches. */
export default function useTransactionTotals(enabled: () => boolean) {
  return useQuery(() => {
    const scope = transactionTableScopeFromStore()
    return {
      queryKey: queryKeys.transactionTotals.detail(
        scope.memoKey,
        scope.timeFrame,
        scope.date,
        scope.budgetCategory,
      ),
      queryFn: async () => normalizeTransactionTotals(await fetchTransactionTotals(scope.params)),
      refetchOnWindowFocus: false,
      enabled: enabled(),
    }
  })
}
