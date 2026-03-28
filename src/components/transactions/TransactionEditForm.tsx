import type { JSX } from 'solid-js'
import { batch, createEffect, createMemo, untrack } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import { useQueryClient } from '@tanstack/solid-query'
import type { BudgetCategoryState, PendingTransaction, SplitBudgetCategory, Transaction } from '@types'
import mutateTransaction from '@api/hooks/transactions/mutateTransaction'
import mutatePendingTransaction from '@api/hooks/transactions/mutatePendingTransaction'
import MemoSelect from '@components/transactions/selects/MemoSelect'
import BudgetCategoryFormField from '@components/transactions/BudgetCategoryFormField'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

function initBudgetState(txn: Transaction): BudgetCategoryState {
  if (txn.is_split && Array.isArray(txn.budget_category)) {
    return {
      mode: 'split',
      splits: txn.budget_category.map((split, index) => ({
        id: `split_${index}_${Date.now()}`,
        budget_category_id: split.budget_category_id,
        amount_debit: split.amount_debit,
      })),
    }
  }
  return {
    mode: 'single',
    categoryId: typeof txn.budget_category === 'string' ? txn.budget_category : null,
  }
}

function getBudgetCategory(state: BudgetCategoryState): string | SplitBudgetCategory[] | undefined {
  if (state.mode === 'single') return state.categoryId ?? undefined
  return state.splits
}

export default function TransactionEditForm(props: {
  transaction: Transaction
  dataTestId?: string
  isPending?: boolean
  pendingTransactionId?: number
  onClose: () => void
}): JSX.Element {
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
      ...tx,
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
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['pending-transactions'] })
            props.onClose()
          },
        },
      )
    } else {
      regMut.mutate(
        { transaction: transactionData },
        {
          onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['transactions'] })
            await queryClient.invalidateQueries({ queryKey: ['transaction', tx.id] })
            props.onClose()
          },
        },
      )
    }
  }

  return (
    <form data-testid={tid()} aria-label="Transaction Edit Form" class="text-foreground space-y-3">
      <Field label="Id" test={`${tid()}-id`}>
        <Input value={tx.id ?? ''} disabled />
      </Field>
      <Field label="Transaction Number" test={`${tid()}-transaction_number`}>
        <Input value={tx.transaction_number ?? ''} disabled />
      </Field>
      <Field label="Date" test={`${tid()}-date`}>
        <Input
          type="date"
          value={tx.date?.slice(0, 10) ?? ''}
          onInput={(e) => setTx('date', e.currentTarget.value)}
        />
      </Field>
      <Field label="Amount Debit" test={`${tid()}-amount_debit`}>
        <Input
          value={tx.amount_debit}
          disabled={!!tx.amount_credit}
          onInput={(e) => setTx('amount_debit', e.currentTarget.value)}
        />
      </Field>
      <Field label="Amount Credit" test={`${tid()}-amount_credit`}>
        <Input
          value={tx.amount_credit}
          disabled={!!tx.amount_debit}
          onInput={(e) => setTx('amount_credit', e.currentTarget.value)}
        />
      </Field>
      <Field label="Description" test={`${tid()}-description`}>
        <Input
          value={tx.description}
          onInput={(e) => setTx('description', e.currentTarget.value)}
        />
      </Field>
      <Field label="Memo" test={`${tid()}-memo`}>
        <MemoSelect value={tx.memo} onChange={(v) => setTx('memo', v)} dataTestId={`${tid()}-memo-select`} />
      </Field>
      <Field label="Balance" test={`${tid()}-balance`}>
        <Input
          value={tx.balance ?? ''}
          onInput={(e) => setTx('balance', e.currentTarget.value)}
        />
      </Field>
      <Field label="Check Number" test={`${tid()}-check_number`}>
        <Input
          value={tx.check_number ?? ''}
          disabled={tx.description !== 'CHECK'}
          onInput={(e) => setTx('check_number', e.currentTarget.value)}
        />
      </Field>
      <Field label="Budget Category" test={`${tid()}-budget_category`}>
        <BudgetCategoryFormField
          modelValue={budgetState}
          transactionAmount={transactionAmount()}
          dataTestId={`${tid()}-budget-field`}
          onChange={(v) => setBudgetState(reconcile(v))}
        />
      </Field>
      <Field label="Fees" test={`${tid()}-fees`}>
        <Input
          value={tx.fees ?? ''}
          onInput={(e) => setTx('fees', e.currentTarget.value)}
        />
      </Field>
      <Button type="button" onClick={saveTransaction} class="mt-4">
        Save
      </Button>
    </form>
  )
}

function Field(props: { label: string; test: string; children: JSX.Element }): JSX.Element {
  return (
    <div class="space-y-1">
      <Label class="text-muted-foreground">{props.label}</Label>
      <div data-testid={props.test}>{props.children}</div>
    </div>
  )
}
