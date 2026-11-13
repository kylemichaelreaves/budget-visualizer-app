import { useQuery } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'
import { fetchCategoryTotals } from '@api/transactions/fetchTransactions'
import { normalizeCategoryTotals } from '@api/transactions/normalizeCategoryTotals'
import { transactionTableScopeFromStore } from '@composables/transactionTableScopeFromStore'

/** Per-category debit totals over every row the transactions table's filter matches. */
export default function useTransactionCategoryTotals(enabled: () => boolean) {
  return useQuery(() => {
    const scope = transactionTableScopeFromStore()
    return {
      queryKey: queryKeys.transactionCategoryTotals.detail(
        scope.memoKey,
        scope.timeFrame,
        scope.date,
        scope.budgetCategory,
      ),
      queryFn: async () => normalizeCategoryTotals(await fetchCategoryTotals(scope.params)),
      refetchOnWindowFocus: false,
      enabled: enabled(),
    }
  })
}
