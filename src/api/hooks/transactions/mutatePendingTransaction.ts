import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { invalidateAfterPendingTransactionApprove } from '@api/queryInvalidation'
import { updatePendingTransaction } from '@api/transactions/updatePendingTransaction'

export default function mutatePendingTransaction() {
  const queryClient = useQueryClient()

  return useMutation(() => ({
    mutationKey: mutationKeys.mutatePendingTransaction,
    mutationFn: async ({
      pendingTransactionId,
      budgetCategory,
    }: {
      pendingTransactionId: number
      budgetCategory: string
    }) => updatePendingTransaction(pendingTransactionId, budgetCategory),
    // Assigning a category approves the row, which writes a transaction. Not awaited:
    // TanStack holds the `mutate()` callbacks (the edit form's `history.back()`) until this settles.
    onSuccess: (_data, { pendingTransactionId }) => {
      void invalidateAfterPendingTransactionApprove(queryClient, { pendingTransactionId })
    },
  }))
}
