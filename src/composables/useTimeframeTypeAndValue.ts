import { createMemo } from 'solid-js'
import { activePeriodFromStore } from '@composables/activePeriodFromStore'
import { Timeframe } from '@types'

/**
 * Reactive view of the active period filter for forms that scope a
 * budget-category picker to it. Falls back to `Year` with no value when no
 * period is selected, which the pickers read as "unscoped".
 */
export default function useTimeframeTypeAndValue(): {
  timeFrame: () => Timeframe
  selectedValue: () => string | undefined
} {
  const period = createMemo(() => activePeriodFromStore())
  const timeFrame = createMemo(() => period()?.timeframe ?? Timeframe.Year)
  const selectedValue = createMemo(() => period()?.value)

  return { timeFrame, selectedValue }
}
