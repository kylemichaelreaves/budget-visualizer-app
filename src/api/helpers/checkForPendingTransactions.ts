import { fetchPendingTransactions } from '@api/transactions/fetchPendingTransactions'
import { devConsole } from '@utils/devConsole'

export async function checkForPendingTransactions(): Promise<boolean> {
  try {
    // Fetch pending transactions with a small limit just to check if any exist
    const pendingTransactions = await fetchPendingTransactions({
      limit: 1,
      offset: 0,
    })

    return pendingTransactions && pendingTransactions.length > 0
  } catch (error) {
    devConsole('error', 'Error checking for pending transactions:', error)
    // If there's an error, don't block navigation
    return false
  }
}
