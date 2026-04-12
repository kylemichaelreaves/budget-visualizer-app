import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import { updateTransaction } from '@api/transactions/updateTransaction'
import type { TransactionPatch } from '@types'

export default function mutateTransaction() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['mutate-transaction'],
    mutationFn: async ({ transaction }: { transaction: TransactionPatch }) => updateTransaction(transaction),
    onSuccess: async (_data, variables) => {
      await invalidateAfterTransactionUpdate(queryClient, { transactionId: variables.transaction.id ?? null })
    },
  }))
}
