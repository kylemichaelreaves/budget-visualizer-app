import { useMutation, useQueryClient } from '@tanstack/solid-query'
import { mutationKeys, queryKeys } from '@api/queryKeys'
import { createTransaction } from '@api/transactions/createTransaction'
import type { Transaction } from '@types'

export default function mutateCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation(() => ({
    mutationKey: mutationKeys.createTransaction,
    mutationFn: (transaction: Transaction) => createTransaction(transaction),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all })
      await queryClient.invalidateQueries({ queryKey: queryKeys.transactionsCount.all })
    },
  }))
}
