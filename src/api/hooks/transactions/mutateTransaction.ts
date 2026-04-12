import { useMutation } from '@tanstack/solid-query'
import { mutationKeys } from '@api/queryKeys'
import { updateTransaction } from '@api/transactions/updateTransaction'
import type { TransactionPatch } from '@types'

export default function mutateTransaction() {
  return useMutation(() => ({
    mutationKey: mutationKeys.mutateTransaction,
    mutationFn: async ({ transaction }: { transaction: TransactionPatch }) => updateTransaction(transaction),
  }))
}
