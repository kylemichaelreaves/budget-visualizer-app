import type { QueryClient } from '@tanstack/solid-query'
import { queryKeys } from '@api/queryKeys'

function invalidateTransactionDerivedQueries(queryClient: QueryClient): Promise<unknown>[] {
  return [
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.transactionsCount.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.budgetCategorySummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.historicalSummaryForBudgetCategory.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memos.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoTransactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.memoSummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.pendingTransactions.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.weekSummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.monthSummary.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.timeUnits.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.sumAmountDebitByDate.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.dailyTotalAmountDebitForInterval.all }),
  ]
}

/**
 * After POSTing a new transaction. A new row can affect memo totals and
 * budget category summaries when the create dialog is used from any page,
 * so invalidate broadly (same scope as updates minus the single-transaction key).
 */
export async function invalidateAfterTransactionCreate(queryClient: QueryClient): Promise<void> {
  await Promise.all(invalidateTransactionDerivedQueries(queryClient))
}

/** After a regular transaction PATCH (table, edit form, category assign). */
export async function invalidateAfterTransactionUpdate(
  queryClient: QueryClient,
  opts?: { transactionId?: number | null },
): Promise<void> {
  const tasks = invalidateTransactionDerivedQueries(queryClient)
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
