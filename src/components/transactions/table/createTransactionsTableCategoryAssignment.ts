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
    void mutation.mutate({ transaction: { id: target.id, budget_category: category } }).then(
      () => {
        void invalidateAfterTransactionUpdate(queryClient, { transactionId: target.id }).finally(() => {
          setMutatingTransactionId(null)
          setCategoryAssignError(null)
        })
      },
      (err) => {
        setMutatingTransactionId(null)
        setCategoryAssignError(extractApiErrorMessage(err))
        setCategoryDialogOpen(true)
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
