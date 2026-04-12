import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'
import { createTransaction } from '@api/transactions/createTransaction'
import type { Transaction } from '@types'

export default function mutateCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.createTransaction,
    mutationFn: (transaction: Transaction) => createTransaction(transaction),
    onSuccess: async () => {
      await invalidateAfterTransactionCreate(queryClient)
    },
  }))
}
