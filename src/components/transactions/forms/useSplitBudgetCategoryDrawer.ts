import { createEffect, on } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
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
  /**
   * The draft lives in a store, and every write is reconciled by `id`, so editing a
   * row updates that row's proxy in place. `<For>` keys rows by identity: with a
   * signal of plain objects, each keystroke replaced the row object, which
   * recreated its inputs and dropped focus after the first character.
   */
  const [rows, setRows] = createStore<SplitBudgetCategory[]>([])
  const local = () => rows
  const setLocal = (update: (current: SplitBudgetCategory[]) => SplitBudgetCategory[]) =>
    setRows(reconcile(update(rows), { key: 'id' }))

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
        // Copy the rows: store writes mutate the underlying objects, and these
        // belong to the parent's form state until the user saves.
        setLocal(() =>
          initialLocalSplits(
            props.splits.map((split) => ({ ...split })),
            () => ({
              id: generateId(),
              budget_category_id: '',
              amount_debit: 0,
            }),
          ),
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

  /** Plain copies for `onSubmit`, detached from the draft store. */
  const snapshot = () => rows.map((row) => ({ ...row }))

  return {
    local,
    snapshot,
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
