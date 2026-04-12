import type { QueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'

/**
 * After POSTing a new transaction. Narrower than {@link invalidateAfterTransactionUpdate}:
 * the new row only affects the infinite list and total count until memo/category summaries
 * need explicit refresh (handled on PATCH paths).
 */
export async function invalidateAfterTransactionCreate(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsCount.all }),
  ])
}

/** After a regular transaction PATCH (table, edit form, category assign). */
export async function invalidateAfterTransactionUpdate(
  queryClient: QueryClient,
  opts?: { transactionId?: number | null },
): Promise<void> {
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsCount.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategorySummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.historicalSummaryForBudgetCategory.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memos.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoTransactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoSummary.all }),
  ]
  const id = opts?.transactionId
  if (id != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: queryKeys.transaction.detail(id) }))
  }
  await Promise.all(tasks)
}

/** After memo metadata changes (category, flags, name) — keeps transactions in sync. */
export async function invalidateAfterMemoMutation(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.memo.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoSummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memos.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoTransactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memosCount }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsCount.all }),
  ])
}
