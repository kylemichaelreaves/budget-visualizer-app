import type { JSX } from 'solid-js'
import { createSignal } from 'solid-js'
import mutateCreateTransaction from '@api/hooks/transactions/mutateCreateTransaction'
import type { NewTransaction } from '@api/transactions/createTransaction'
import type { Transaction } from '@types'
import AlertComponent from '@components/shared/AlertComponent'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

export default function TransactionCreateForm(props: { onClose?: () => void }): JSX.Element {
  const [isDebit, setIsDebit] = createSignal(true)
  const [form, setForm] = createSignal<
    Pick<Transaction, 'date' | 'description' | 'memo' | 'amount_debit' | 'amount_credit'>
  >({
    date: '',
    description: '',
    memo: '',
    amount_debit: '',
    amount_credit: '',
  })

  const createMut = mutateCreateTransaction()

  const activeAmount = () => (isDebit() ? form().amount_debit : form().amount_credit)
  /** The backend rejects a create without memo, amountDebit or date. */
  const canSubmit = () => Boolean(form().date && form().memo.trim() && activeAmount().trim())

  const toggleDebit = () => {
    // Clear both amounts so a stale value on the inactive side can never be sent.
    setForm({ ...form(), amount_debit: '', amount_credit: '' })
    setIsDebit(!isDebit())
  }

  const saveTransaction = () => {
    if (!canSubmit()) return
    const f = form()
    const amount = activeAmount().trim()
    const transaction: NewTransaction = {
      date: f.date,
      description: f.description,
      memo: f.memo.trim(),
      ...(isDebit() ? { amount_debit: amount } : { amount_debit: '0', amount_credit: amount }),
    }
    createMut.mutate(transaction, {
      onSuccess: () => {
        setForm({
          date: '',
          description: '',
          memo: '',
          amount_debit: '',
          amount_credit: '',
        })
        props.onClose?.()
      },
    })
  }

  return (
    <div data-testid="transaction-form" class="space-y-3">
      {createMut.isError && createMut.error ? (
        <AlertComponent
          type="error"
          title={(createMut.error as Error).name}
          message={(createMut.error as Error).message}
          dataTestId="transaction-form-error-alert"
        />
      ) : null}
      <Label class="flex items-center gap-3 my-3 text-foreground">
        <input
          type="checkbox"
          checked={isDebit()}
          onChange={toggleDebit}
          data-testid="transaction-type-switch"
        />
        Debit (off = credit)
      </Label>
      <div class="space-y-1">
        <Label for="create-date" class="text-muted-foreground">
          Date
        </Label>
        <Input
          id="create-date"
          type="date"
          value={form().date}
          data-testid="transaction-input-date"
          onInput={(e) => setForm({ ...form(), date: e.currentTarget.value })}
        />
      </div>
      <div class="space-y-1">
        <Label for="create-description" class="text-muted-foreground">
          Description
        </Label>
        <Input
          id="create-description"
          value={form().description}
          data-testid="transaction-input-description"
          onInput={(e) => setForm({ ...form(), description: e.currentTarget.value })}
        />
      </div>
      <div class="space-y-1">
        <Label for="create-memo" class="text-muted-foreground">
          Memo
        </Label>
        <Input
          id="create-memo"
          value={form().memo}
          data-testid="transaction-input-memo"
          onInput={(e) => setForm({ ...form(), memo: e.currentTarget.value })}
        />
      </div>
      <div class="space-y-1">
        <Label for="create-amount-debit" class="text-muted-foreground">
          Amount Debit
        </Label>
        <Input
          id="create-amount-debit"
          value={form().amount_debit}
          disabled={!isDebit()}
          data-testid="transaction-input-amount_debit"
          onInput={(e) => setForm({ ...form(), amount_debit: e.currentTarget.value })}
        />
      </div>
      <div class="space-y-1">
        <Label for="create-amount-credit" class="text-muted-foreground">
          Amount Credit
        </Label>
        <Input
          id="create-amount-credit"
          value={form().amount_credit}
          disabled={isDebit()}
          data-testid="transaction-input-amount_credit"
          onInput={(e) => setForm({ ...form(), amount_credit: e.currentTarget.value })}
        />
      </div>
      <Button
        type="button"
        data-testid="transaction-submit-button"
        onClick={saveTransaction}
        disabled={createMut.isPending || !canSubmit()}
      >
        {createMut.isPending ? 'Creating\u2026' : 'Create Transaction'}
      </Button>
    </div>
  )
}
