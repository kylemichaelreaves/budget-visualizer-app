import type { JSX } from 'solid-js'
import { batch, Show } from 'solid-js'
import { reconcile } from 'solid-js/store'
import MemoSelect from '@components/transactions/selects/MemoSelect'
import BudgetCategoryFormField from './BudgetCategoryFormField'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import type { Transaction } from '@types'
import { mutationAlertFromError } from './transactionEditFormUtils'
import { useTransactionEditForm } from './useTransactionEditForm'

export default function TransactionEditForm(props: {
  transaction: Transaction
  dataTestId?: string
  isPending?: boolean
  pendingTransactionId?: number
  onClose: () => void
}): JSX.Element {
  const state = useTransactionEditForm(props)

  return (
    <form data-testid={state.tid()} aria-label="Transaction Edit Form" class="text-foreground space-y-3">
      <Show when={state.activeMutationError()}>
        {(err) => {
          const { title, message } = mutationAlertFromError(err())
          return (
            <AlertComponent
              type="error"
              title={title}
              message={message}
              dataTestId={`${state.tid()}-error-alert`}
            />
          )
        }}
      </Show>
      <Field label="Id" test={`${state.tid()}-id`}>
        <Input id={`field-${state.tid()}-id`} value={state.tx.id ?? ''} disabled />
      </Field>
      <Field label="Transaction Number" test={`${state.tid()}-transaction_number`}>
        <Input
          id={`field-${state.tid()}-transaction_number`}
          value={state.tx.transaction_number ?? ''}
          disabled
        />
      </Field>
      <Field label="Date" test={`${state.tid()}-date`}>
        <Input
          id={`field-${state.tid()}-date`}
          type="date"
          value={state.tx.date?.slice(0, 10) ?? ''}
          onInput={(e) => state.setTx('date', e.currentTarget.value)}
        />
      </Field>
      <Field label="Amount Debit" test={`${state.tid()}-amount_debit`}>
        <Input
          id={`field-${state.tid()}-amount_debit`}
          value={state.tx.amount_debit}
          disabled={!!state.tx.amount_credit}
          onInput={(e) => state.setTx('amount_debit', e.currentTarget.value)}
        />
      </Field>
      <Field label="Amount Credit" test={`${state.tid()}-amount_credit`}>
        <Input
          id={`field-${state.tid()}-amount_credit`}
          value={state.tx.amount_credit}
          disabled={!!state.tx.amount_debit}
          onInput={(e) => state.setTx('amount_credit', e.currentTarget.value)}
        />
      </Field>
      <Field label="Description" test={`${state.tid()}-description`}>
        <Input
          id={`field-${state.tid()}-description`}
          value={state.tx.description}
          onInput={(e) => state.setTx('description', e.currentTarget.value)}
        />
      </Field>
      <Field label="Memo" test={`${state.tid()}-memo`} hasInput={false}>
        <MemoSelect
          value={state.tx.memo}
          onChange={(v, memoId) =>
            batch(() => {
              state.setTx('memo', v)
              state.setTx('memo_id', memoId ?? null)
            })
          }
          dataTestId={`${state.tid()}-memo-select`}
        />
      </Field>
      <Field label="Balance" test={`${state.tid()}-balance`}>
        <Input
          id={`field-${state.tid()}-balance`}
          value={state.tx.balance ?? ''}
          onInput={(e) => state.setTx('balance', e.currentTarget.value)}
        />
      </Field>
      <Field label="Check Number" test={`${state.tid()}-check_number`}>
        <Input
          id={`field-${state.tid()}-check_number`}
          value={state.tx.check_number ?? ''}
          disabled={state.tx.description !== 'CHECK'}
          onInput={(e) => state.setTx('check_number', e.currentTarget.value)}
        />
      </Field>
      <Field label="Budget Category" test={`${state.tid()}-budget_category`} hasInput={false}>
        <BudgetCategoryFormField
          modelValue={state.budgetState}
          transactionAmount={state.transactionAmount()}
          dataTestId={`${state.tid()}-budget-field`}
          onChange={(v) => state.setBudgetState(reconcile(v))}
        />
      </Field>
      <Field label="Fees" test={`${state.tid()}-fees`}>
        <Input
          id={`field-${state.tid()}-fees`}
          value={state.tx.fees ?? ''}
          onInput={(e) => state.setTx('fees', e.currentTarget.value)}
        />
      </Field>
      <Button
        type="button"
        onClick={state.saveTransaction}
        class="mt-4"
        disabled={state.activeMut().isPending}
      >
        {state.activeMut().isPending ? 'Saving\u2026' : 'Save'}
      </Button>
    </form>
  )
}

function Field(props: {
  label: string
  test: string
  hasInput?: boolean
  children: JSX.Element
}): JSX.Element {
  const id = () => `field-${props.test}`
  return (
    <div class="space-y-1">
      <Label for={props.hasInput !== false ? id() : undefined} class="text-muted-foreground">
        {props.label}
      </Label>
      <div data-testid={props.test}>{props.children}</div>
    </div>
  )
}
