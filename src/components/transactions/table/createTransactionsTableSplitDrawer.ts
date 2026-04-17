import { createSignal } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import mutateTransaction from '@api/hooks/transactions/mutateTransaction'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import type { SplitBudgetCategory, Transaction } from '@types'

export function createTransactionsTableSplitDrawer(args?: {
  setMutatingTransactionId?: (id: number | null) => void
}) {
  const queryClient = useQueryClient()
  const mutation = mutateTransaction()

  const [open, setOpen] = createSignal(false)
  const [target, setTarget] = createSignal<Transaction | null>(null)
  const [error, setError] = createSignal<string | null>(null)

  function openSplitDrawer(row: Transaction) {
    setError(null)
    setTarget(row)
    setOpen(true)
  }

  function closeSplitDrawer() {
    setOpen(false)
    setTarget(null)
  }

  function handleSubmit(splits: SplitBudgetCategory[]) {
    const t = target()
    if (!t || t.id == null) return
    setError(null)
    args?.setMutatingTransactionId?.(t.id)
    setOpen(false)
    mutation.mutate(
      { transaction: { id: t.id, budget_category: splits, is_split: true } },
      {
        onSuccess: async () => {
          await invalidateAfterTransactionUpdate(queryClient, { transactionId: t.id })
          args?.setMutatingTransactionId?.(null)
          setTarget(null)
        },
        onError: (err) => {
          args?.setMutatingTransactionId?.(null)
          const msg = err instanceof Error ? err.message : String(err)
          setError(msg)
          setOpen(true)
        },
      },
    )
  }

  function handleClear() {
    const t = target()
    if (!t || t.id == null) return
    setError(null)
    args?.setMutatingTransactionId?.(t.id)
    setOpen(false)
    mutation.mutate(
      { transaction: { id: t.id, budget_category: null, is_split: false } },
      {
        onSuccess: async () => {
          await invalidateAfterTransactionUpdate(queryClient, { transactionId: t.id })
          args?.setMutatingTransactionId?.(null)
          setTarget(null)
        },
        onError: (err) => {
          args?.setMutatingTransactionId?.(null)
          const msg = err instanceof Error ? err.message : String(err)
          setError(msg)
          setOpen(true)
        },
      },
    )
  }

  return {
    open,
    setOpen,
    target,
    error,
    setError,
    openSplitDrawer,
    closeSplitDrawer,
    handleSubmit,
    handleClear,
  }
}
