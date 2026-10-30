import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'
import { updatePendingTransaction } from '@api/transactions/updatePendingTransaction'
import { devConsole } from '@utils/devConsole'

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
    onSuccess: async () => {
      devConsole('log', '[mutatePendingTransaction] success, invalidate pending queries')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pendingTransactions.all,
        refetchType: 'active',
      })
      // Assigning a category approves the row, which writes a transaction.
      await invalidateAfterTransactionCreate(queryClient)
    },
  }))
}
