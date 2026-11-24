import { createMemo, createStore, snapshot, untrack } from 'solid-js'
import { useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import type { BudgetCategoryState, Transaction, TransactionPatch } from '@types'
import mutateTransaction from '@api/hooks/transactions/mutateTransaction'
import mutatePendingTransaction from '@api/hooks/transactions/mutatePendingTransaction'
import { getBudgetCategory, initBudgetState } from './transactionEditFormUtils'

export function useTransactionEditForm(props: {
  transaction: Transaction
  dataTestId?: string
  isPending?: boolean
  pendingTransactionId?: number
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const tid = () => props.dataTestId ?? 'transaction-edit-form'

  // Seeded once per entity. A refetch of the same transaction hands down a new
  // object, and re-seeding on that discarded edits. Pending rows key on the pending
  // id: their parsed transaction_data may have no id. The derived stores track only
  // that key (a memo, so equal values don't re-run them) and read the transaction
  // untracked; writes through the setters stand until the key changes.
  const entityKey = createMemo(() => `${props.pendingTransactionId ?? ''}:${props.transaction.id ?? ''}`)
  const [tx, setTx] = createStore<Transaction>(
    () => {
      entityKey()
      return untrack(() => ({ ...props.transaction }))
    },
    untrack(() => ({ ...props.transaction })),
  )
  const [budgetState, setBudgetState] = createStore<BudgetCategoryState>(
    () => {
      entityKey()
      return untrack(() => initBudgetState(props.transaction))
    },
    untrack(() => initBudgetState(props.transaction)),
  )

  const transactionAmount = createMemo(() => {
    const debit = Number.parseFloat(tx.amount_debit || '0')
    if (debit !== 0) return debit
    return Number.parseFloat(tx.amount_credit || '0')
  })

  const regMut = mutateTransaction()
  const pendMut = mutatePendingTransaction()

  const saveTransaction = () => {
    const budgetCategory = getBudgetCategory(budgetState)

    if (props.isPending && props.pendingTransactionId != null) {
      // The pending endpoint takes a single category name and nothing else.
      if (typeof budgetCategory !== 'string' || !budgetCategory.trim()) return
      void pendMut.mutate({ pendingTransactionId: props.pendingTransactionId, budgetCategory }).then(
        () => props.onClose(),
        () => {},
      )
    } else {
      const id = tx.id
      if (id == null) return
      const patch: TransactionPatch = {
        ...snapshot(tx),
        id,
        budget_category: budgetCategory,
        is_split: budgetState.mode === 'split',
      }
      void regMut.mutate({ transaction: patch }).then(
        () => {
          void invalidateAfterTransactionUpdate(queryClient, { transactionId: id })
          props.onClose()
        },
        () => {},
      )
    }
  }

  const isPendingMutation = () => Boolean(props.isPending && props.pendingTransactionId != null)
  const activeMut = () => (isPendingMutation() ? pendMut : regMut)
  /** Approving a pending row requires a single category; the regular PATCH accepts anything. */
  const canSave = () =>
    !isPendingMutation() || (budgetState.mode === 'single' && Boolean(budgetState.categoryId?.trim()))

  const activeMutationError = createMemo(() => {
    const m = activeMut()
    if (!m.isError || m.error == null) return undefined
    return m.error
  })

  return {
    tx,
    setTx,
    budgetState,
    setBudgetState,
    transactionAmount,
    saveTransaction,
    activeMut,
    activeMutationError,
    canSave,
    tid,
  }
}
