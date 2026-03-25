import { httpClient } from '@api/httpClient'
import type { PendingTransaction } from '@types'
import { devConsole } from '@utils/devConsole'

export async function updatePendingTransaction(
  pendingTransactionId: number,
  pendingTransaction: PendingTransaction,
): Promise<void> {
  try {
    if (typeof pendingTransaction.transaction_data === 'string') {
      devConsole('log', '[updatePendingTransaction] API call with:', {
        pendingTransactionId,
        pendingTransaction,
        budget_category: JSON.parse(pendingTransaction.transaction_data).budget_category,
        assigned_category: pendingTransaction.assigned_category,
      })
    }

    const response = await httpClient.patch(`/transactions/pending/${pendingTransactionId}`, {
      pendingTransaction,
    })

    devConsole('log', '[updatePendingTransaction] API response:', response.data)
  } catch (error) {
    devConsole('error', '[updatePendingTransaction] Error updating pending transaction:', error)
    throw error
  }
}
