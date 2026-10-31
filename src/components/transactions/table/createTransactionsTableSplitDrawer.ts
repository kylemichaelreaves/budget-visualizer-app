import { createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import mutateTransaction from '@api/hooks/transactions/mutateTransaction'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import type { SplitBudgetCategory, Transaction } from '@types'

/**
 * The drawer stays open while a save is in flight and closes only on success.
 * Closing first and reopening on error was a closed -> open edge, which re-seeds
 * the drawer from the row's saved splits and threw away the user's allocations.
 */
export function createTransactionsTableSplitDrawer(args?: {
  setMutatingTransactionId?: (id: number | null) => void
}) {
  const queryClient = useQueryClient()
  const mutation = mutateTransaction()

  const [open, setOpen] = createSignal(false)
  const [target, setTarget] = createSignal<Transaction | null>(null)
  const [savingFor, setSavingFor] = createSignal<Transaction | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  // A failed save whose drawer was cancelled (or replaced) before the response came back.
  const [strayError, setStrayError] = createSignal<string | null>(null)

  const saving = () => savingFor() !== null && savingFor() === target()
  const isShowing = (t: Transaction) => open() && target() === t

  function openSplitDrawer(row: Transaction) {
    setError(null)
    setTarget(row)
    setOpen(true)
  }

  function closeSplitDrawer() {
    setOpen(false)
    setTarget(null)
  }

  function save(change: { budget_category: SplitBudgetCategory[] | null; is_split: boolean }) {
    const t = target()
    const id = t?.id
    if (!t || id == null) return
    setError(null)
    setStrayError(null)
    setSavingFor(t)
    args?.setMutatingTransactionId?.(id)
    mutation.mutate(
      { transaction: { id, ...change } },
      {
        onSuccess: () => {
          if (savingFor() === t) setSavingFor(null)
          // The user may have cancelled and opened another row while this was in flight.
          if (isShowing(t)) closeSplitDrawer()
          void invalidateAfterTransactionUpdate(queryClient, { transactionId: id }).finally(() =>
            args?.setMutatingTransactionId?.(null),
          )
        },
        onError: (err) => {
          if (savingFor() === t) setSavingFor(null)
          args?.setMutatingTransactionId?.(null)
          const msg = err instanceof Error ? err.message : String(err)
          if (isShowing(t)) setError(msg)
          else setStrayError(msg)
        },
      },
    )
  }

  function handleSubmit(splits: SplitBudgetCategory[]) {
    save({ budget_category: splits, is_split: true })
  }

  function handleClear() {
    save({ budget_category: null, is_split: false })
  }

  return {
    open,
    target,
    saving,
    error,
    strayError,
    setStrayError,
    openSplitDrawer,
    closeSplitDrawer,
    handleSubmit,
    handleClear,
  }
}
