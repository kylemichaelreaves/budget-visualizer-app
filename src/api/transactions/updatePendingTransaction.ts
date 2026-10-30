import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

/**
 * PATCH `/transactions/pending/:id` — approves a pending row by assigning it a category.
 * The backend reads only a top-level `budgetCategory` string; it does not accept splits.
 */
export async function updatePendingTransaction(
  pendingTransactionId: number,
  budgetCategory: string,
): Promise<void> {
  try {
    const response = await httpClient.patch(`/transactions/pending/${pendingTransactionId}`, {
      budgetCategory,
    })
    devConsole('log', '[updatePendingTransaction] API response:', response.data)
  } catch (error) {
    devConsole('error', '[updatePendingTransaction] Error updating pending transaction:', error)
    throw error
  }
}
