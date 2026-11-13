import mutateTransaction from '@api/hooks/transactions/mutateTransaction'
import { extractApiErrorMessage } from '@api/extractApiErrorMessage'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import { useQueryClient } from '@tanstack/solid-query'
import { createSignal } from 'solid-js'
import type { Transaction } from '@types'

export function createTransactionsTableCategoryAssignment() {
  const queryClient = useQueryClient()
  const mutation = mutateTransaction()

  const [categoryDialogOpen, setCategoryDialogOpen] = createSignal(false)
  const [categoryDialogTarget, setCategoryDialogTarget] = createSignal<Transaction | null>(null)
  const [mutatingTransactionId, setMutatingTransactionId] = createSignal<number | null>(null)
  const [categoryAssignError, setCategoryAssignError] = createSignal<string | null>(null)

  function openCategoryDialog(row: Transaction) {
    setCategoryAssignError(null)
    setCategoryDialogTarget(row)
    setCategoryDialogOpen(true)
  }

  function handleCategorySelect(category: string) {
    const target = categoryDialogTarget()
    if (!target || target.id == null) return
    setCategoryAssignError(null)
    setMutatingTransactionId(target.id)
    mutation.mutate(
      { transaction: { id: target.id, budget_category: category } },
      {
        // TanStack does not await a `mutate()` callback, so chain rather than `async`:
        // the row stays marked until the refetch lands, even if the refetch fails.
        onSuccess: () => {
          void invalidateAfterTransactionUpdate(queryClient, { transactionId: target.id }).finally(() => {
            setMutatingTransactionId(null)
            setCategoryAssignError(null)
          })
        },
        onError: (err) => {
          setMutatingTransactionId(null)
          setCategoryAssignError(extractApiErrorMessage(err))
          setCategoryDialogOpen(true)
        },
      },
    )
  }

  return {
    categoryDialogOpen,
    setCategoryDialogOpen,
    categoryDialogTarget,
    mutatingTransactionId,
    setMutatingTransactionId,
    categoryAssignError,
    setCategoryAssignError,
    openCategoryDialog,
    handleCategorySelect,
  }
}
