import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { updatePendingTransaction } from '@api/transactions/updatePendingTransaction'
import { clearPendingTransactionsByOffset } from '@stores/transactionsStore'
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
    onSuccess: async () => {
      devConsole('log', '[mutatePendingTransaction] success, invalidate pending queries')
      clearPendingTransactionsByOffset()
      await queryClient.invalidateQueries({
        queryKey: queryKeys.pendingTransactions.all,
        refetchType: 'active',
      })
    },
  }))
}
