import { createEffect, createSignal, on } from 'solid-js'
import type { SplitBudgetCategory } from '@types'
import { generateId } from '@components/transactions/helpers/generateId'
import {
  appendSplitRow,
  initialLocalSplits,
  removeSplitRowAt,
  splitDrawerIsValid,
  splitIsBalanced,
  splitRemaining,
  sumAllocatedAmounts,
  updateSplitAmountAt,
  updateSplitCategoryAt,
} from './splitBudgetCategoryDrawerUtils'

/**
 * Props accepted by the split budget category drawer hook.
 *
 * `open` drives when the local draft is seeded. `transactionAmount` is read
 * reactively by the totals. `splits` is read only at seed time — see below.
 */
export type UseSplitBudgetCategoryDrawerProps = {
  open: boolean
  splits: SplitBudgetCategory[]
  transactionAmount: number
}

export function useSplitBudgetCategoryDrawer(props: UseSplitBudgetCategoryDrawerProps) {
  const [local, setLocal] = createSignal<SplitBudgetCategory[]>([])

  /**
   * Seed the local draft on the closed -> open edge only.
   *
   * This deliberately does not track `props.splits`. That array is derived from
   * the transaction row in the query cache, so any background refetch or
   * invalidation hands down a fresh array identity. When this effect tracked it,
   * that re-ran `initialLocalSplits` and silently discarded whatever the user
   * had typed into the open drawer.
   *
   * `on` runs its callback untracked, so reading `props.splits` here reads the
   * current value without subscribing to it.
   */
  createEffect(
    on(
      () => props.open,
      (isOpen, wasOpen) => {
        if (!isOpen || wasOpen) return
        setLocal(
          initialLocalSplits(props.splits, () => ({
            id: generateId(),
            budget_category_id: '',
            amount_debit: 0,
          })),
        )
      },
    ),
  )

  const totalAllocated = () => sumAllocatedAmounts(local())
  const remaining = () => splitRemaining(props.transactionAmount, totalAllocated())
  const isBalanced = () => splitIsBalanced(remaining())
  const isValid = () => splitDrawerIsValid(local(), props.transactionAmount)

  function updateAmount(index: number, v: number) {
    setLocal((rows) => updateSplitAmountAt(rows, index, v))
  }

  function updateCategory(index: number, id: string | null) {
    setLocal((rows) => updateSplitCategoryAt(rows, index, id))
  }

  function addSplit() {
    setLocal((rows) => appendSplitRow(rows, { id: generateId(), budget_category_id: '', amount_debit: 0 }))
  }

  function removeSplit(index: number) {
    setLocal((rows) => removeSplitRowAt(rows, index))
  }

  return {
    local,
    totalAllocated,
    remaining,
    isBalanced,
    isValid,
    updateAmount,
    updateCategory,
    addSplit,
    removeSplit,
  }
}
