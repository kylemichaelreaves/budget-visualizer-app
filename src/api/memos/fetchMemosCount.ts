import { httpClient } from '@api/httpClient.ts'
import { devConsole } from '@utils/devConsole'

export async function fetchMemosCount(
  timeFrame?: string,
  date?: Date,
  distinct?: boolean,
): Promise<
  {
    count: number
  }[]
> {
  try {
    const res = await httpClient.get(`/memos?count=true`, {
      params: {
        timeFrame: timeFrame,
        date: date,
        distinct: distinct,
      },
    })
    return res.data
  } catch (err) {
    devConsole('error', 'Error fetching memos count:', { timeFrame, date, distinct }, err)
    throw err
  }
}
