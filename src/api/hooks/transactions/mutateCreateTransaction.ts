import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { invalidateAfterTransactionCreate } from '@api/queryInvalidation'
import { createTransaction, type NewTransaction } from '@api/transactions/createTransaction'

export default function mutateCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.createTransaction,
    mutationFn: (transaction: NewTransaction) => createTransaction(transaction),
    // Not awaited: TanStack holds the `mutate()` callbacks (closing the dialog) until this settles.
    onSuccess: () => {
      void invalidateAfterTransactionCreate(queryClient)
    },
  }))
}
