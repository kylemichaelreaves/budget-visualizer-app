import type { QueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'

/**
 * After POSTing a new transaction. A new row can affect memo totals and
 * budget category summaries when the create dialog is used from any page,
 * so invalidate broadly (same scope as updates minus the single-transaction key).
 */
export async function invalidateAfterTransactionCreate(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsCount.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategorySummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.historicalSummaryForBudgetCategory.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memos.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoTransactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoSummary.all }),
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
