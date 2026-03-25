import { httpClient } from '@api/httpClient'
import { devConsole } from '@utils/devConsole'

export async function fetchSumAmountDebitByDate(
  timeFrame: string,
  date: string,
  totalAmountDebit = true,
): Promise<Array<{ total_amount_debit: number }>> {
  try {
    const res = await httpClient.get(`/transactions`, {
      params: {
        timeFrame,
        date,
        totalAmountDebit,
      },
    })
    return res.data
  } catch (err) {
    devConsole(
      'error',
      'Error fetching sum amount debit by date:',
      { timeFrame, date, totalAmountDebit },
      err,
    )
    throw err // Re-throw so Vue Query can handle the error state
  }
}
