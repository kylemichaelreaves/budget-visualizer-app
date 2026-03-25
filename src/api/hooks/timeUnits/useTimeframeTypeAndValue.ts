import { createMemo } from 'solid-js'
import { transactionsState } from '@stores/transactionsStore'
import { Timeframe } from '@types'

export default function useTimeframeTypeAndValue(): {
  timeFrame: () => Timeframe
  selectedValue: () => string | undefined
} {
  const timeFrame = createMemo(() => {
    if (transactionsState.selectedDay) return Timeframe.Day
    if (transactionsState.selectedWeek) return Timeframe.Week
    if (transactionsState.selectedMonth) return Timeframe.Month
    return Timeframe.Year
  })

  const selectedValue = createMemo(() => {
    if (transactionsState.selectedDay) return transactionsState.selectedDay
    if (transactionsState.selectedWeek) return transactionsState.selectedWeek
    if (transactionsState.selectedMonth) return transactionsState.selectedMonth
    return transactionsState.selectedYear || undefined
  })

  return { timeFrame, selectedValue }
}
