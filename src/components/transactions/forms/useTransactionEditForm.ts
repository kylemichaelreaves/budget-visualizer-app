import { batch, createEffect, createMemo, untrack } from 'solid-js'
import { createStore, unwrap } from 'solid-js/store'
import { useQueryClient } from '@tanstack/solid-query'
import { invalidateAfterTransactionUpdate } from '@api/queryInvalidation'
import type { BudgetCategoryState, PendingTransaction, Transaction, TransactionPatch } from '@types'
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

  const [tx, setTx] = createStore<Transaction>(untrack(() => ({ ...props.transaction })))
  const [budgetState, setBudgetState] = createStore<BudgetCategoryState>(
    untrack(() => initBudgetState(props.transaction)),
  )

  createEffect(() => {
    const p = props.transaction
    batch(() => {
      setTx(p)
      setBudgetState(initBudgetState(p))
    })
  })

  const transactionAmount = createMemo(() => {
    const debit = Number.parseFloat(tx.amount_debit || '0')
    if (debit !== 0) return debit
    return Number.parseFloat(tx.amount_credit || '0')
  })

  const regMut = mutateTransaction()
  const pendMut = mutatePendingTransaction()

  const saveTransaction = () => {
    const budgetCategory = getBudgetCategory(budgetState)

    const transactionData: Transaction = {
      ...unwrap(tx),
      budget_category: budgetCategory,
      is_split: budgetState.mode === 'split',
    }

    if (props.isPending && props.pendingTransactionId != null) {
      const pendingTransactionData: PendingTransaction = {
        id: props.pendingTransactionId,
        created_at: '',
        transaction_data: transactionData,
        amount_debit: tx.amount_debit || '0.00',
        transaction_date: tx.date,
        memo_name: tx.memo,
        assigned_category: budgetCategory,
        status: 'reviewed',
      }
      pendMut.mutate(
        {
          pendingTransactionId: props.pendingTransactionId,
          pendingTransaction: pendingTransactionData,
        },
        {
          onSuccess: () => {
            props.onClose()
          },
        },
      )
    } else {
      const id = tx.id
      if (id == null) return
      const patch: TransactionPatch = {
        ...unwrap(tx),
        id,
        budget_category: budgetCategory,
        is_split: budgetState.mode === 'split',
      }
      regMut.mutate(
        { transaction: patch },
        {
          onSuccess: async () => {
            await invalidateAfterTransactionUpdate(queryClient, { transactionId: id })
            props.onClose()
          },
        },
      )
    }
  }

  const activeMut = () => (props.isPending ? pendMut : regMut)

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
    tid,
  }
}
