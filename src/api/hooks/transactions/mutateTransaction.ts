import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import { updateTransaction } from '@api/transactions/updateTransaction'
import type { TransactionPatch } from '@types'

export default function mutateTransaction() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.mutateTransaction,
    mutationFn: async ({ transaction }: { transaction: TransactionPatch }) => updateTransaction(transaction),
    onSuccess: (_data, variables) => {
      void invalidateAfterTransactionUpdate(queryClient, { transactionId: variables.transaction.id ?? null })
    },
  }))
}
