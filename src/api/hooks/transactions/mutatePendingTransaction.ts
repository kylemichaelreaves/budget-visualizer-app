import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'
import { updatePendingTransaction } from '@api/transactions/updatePendingTransaction'
import type { PendingTransaction } from '@types'
import { devConsole } from '@utils/devConsole'

export default function mutatePendingTransaction() {
  const queryClient = useQueryClient()

  return useMutation(() => ({
    mutationKey: mutationKeys.mutatePendingTransaction,
    mutationFn: async ({
      pendingTransactionId,
      pendingTransaction,
    }: {
      pendingTransactionId: number
      pendingTransaction: PendingTransaction
    }) => updatePendingTransaction(pendingTransactionId, pendingTransaction),
    onSuccess: async (_data, variables) => {
      devConsole('log', '[mutatePendingTransaction] success, invalidate pending queries')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pendingTransactions.all,
        refetchType: 'active',
      })
      if (variables.pendingTransaction.status === 'reviewed') {
        await invalidateAfterTransactionCreate(queryClient)
      }
    },
  }))
}
