import { createEffect, createSignal } from 'solid-js'
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

/** Subset of SplitBudgetCategoryDrawer props the hook reads reactively. */
export type UseSplitBudgetCategoryDrawerProps = {
  open: boolean
  splits: SplitBudgetCategory[]
  transactionAmount: number
  onSubmit: (splits: SplitBudgetCategory[]) => void
  onCancel: () => void
}

export function useSplitBudgetCategoryDrawer(props: UseSplitBudgetCategoryDrawerProps) {
  const [local, setLocal] = createSignal<SplitBudgetCategory[]>([])

  createEffect(() => {
    if (props.open) {
      setLocal(
        initialLocalSplits(props.splits, () => ({
          id: generateId(),
          budget_category_id: '',
          amount_debit: 0,
        })),
      )
    }
  })

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
