import { createMemo } from 'solid-js'
import {
  resolveTransactionDateFromStore,
  resolveTransactionTimeframeFromStore,
} from '@composables/transactionQueryScopeFromStore'
import type { Timeframe } from '@types'

export default function useTimeframeTypeAndValue(): {
  timeFrame: () => Timeframe
  selectedValue: () => string | undefined
} {
  const timeFrame = createMemo(() => resolveTransactionTimeframeFromStore())
  const selectedValue = createMemo(() => resolveTransactionDateFromStore())

  return { timeFrame, selectedValue }
}
