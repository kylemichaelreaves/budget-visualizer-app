import { useMutation } from '@tanstack/solid-query'
import { updateTransaction } from '@api/transactions/updateTransaction'
import type { TransactionPatch } from '@types'

export default function mutateTransaction() {
  return useMutation(() => ({
    mutationKey: ['mutate-transaction'],
    mutationFn: async ({ transaction }: { transaction: TransactionPatch }) => updateTransaction(transaction),
  }))
}
