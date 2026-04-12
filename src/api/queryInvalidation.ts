import type { QueryClient } from '@tanstack/solid-query'

/** After a regular transaction PATCH (table, edit form, category assign). */
export async function invalidateAfterTransactionUpdate(
  queryClient: QueryClient,
  opts?: { transactionId?: number | null },
): Promise<void> {
  const tasks: Promise<unknown>[] = [
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions-count'] }),
    queryClient.invalidateQueries({ queryKey: ['budget-category-summary'] }),
    queryClient.invalidateQueries({ queryKey: ['historical-summary-for-budget-category'] }),
    queryClient.invalidateQueries({ queryKey: ['memos'] }),
    queryClient.invalidateQueries({ queryKey: ['memo-transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['memo-summary'] }),
  ]
  const id = opts?.transactionId
  if (id != null) {
    tasks.push(queryClient.invalidateQueries({ queryKey: ['transaction', id] }))
  }
  await Promise.all(tasks)
}

/** After memo metadata changes (category, flags, name) — keeps transactions in sync. */
export async function invalidateAfterMemoMutation(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['memo'] }),
    queryClient.invalidateQueries({ queryKey: ['memo-summary'] }),
    queryClient.invalidateQueries({ queryKey: ['memos'] }),
    queryClient.invalidateQueries({ queryKey: ['memo-transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['memos-count'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions'] }),
    queryClient.invalidateQueries({ queryKey: ['transactions-count'] }),
  ])
}
