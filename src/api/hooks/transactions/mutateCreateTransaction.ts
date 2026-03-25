import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { createTransaction } from '@api/transactions/createTransaction'
import type { Transaction } from '@types'

export default function mutateCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: ['create-transaction'],
    mutationFn: (transaction: Transaction) => createTransaction(transaction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] })
      await queryClient.invalidateQueries({ queryKey: ['transactions-count'] })
    },
  }))
}
