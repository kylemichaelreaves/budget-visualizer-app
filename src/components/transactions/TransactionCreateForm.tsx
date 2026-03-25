import type { JSX } from 'solid-js'
import { createSignal } from 'solid-js'
import mutateCreateTransaction from '@api/hooks/transactions/mutateCreateTransaction'
import type { Transaction } from '@types'
import AlertComponent from '@components/shared/AlertComponent'

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

  const saveTransaction = () => {
    const f = form()
    if (!f.date || (!f.amount_debit && !f.amount_credit)) {
      return
    }
    const transaction: Transaction = {
      ...f,
      amount_debit: f.amount_debit,
      amount_credit: f.amount_credit,
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
    <div data-testid="transaction-form">
      {createMut.isError && createMut.error ? (
        <AlertComponent
          type="error"
          title={(createMut.error as Error).name}
          message={(createMut.error as Error).message}
          dataTestId="transaction-form-error-alert"
        />
      ) : null}
      <label
        style={{ display: 'flex', 'align-items': 'center', gap: '12px', margin: '12px 0', color: '#ecf0f1' }}
      >
        <input
          type="checkbox"
          checked={isDebit()}
          onChange={() => setIsDebit(!isDebit())}
          data-testid="transaction-type-switch"
        />
        Debit (off = credit)
      </label>
      <label style={{ display: 'block', margin: '10px 0', color: '#bdc3c7' }}>
        Date
        <input
          type="date"
          value={form().date}
          data-testid="transaction-input-date"
          onInput={(e) => setForm({ ...form(), date: e.currentTarget.value })}
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        />
      </label>
      <label style={{ display: 'block', margin: '10px 0', color: '#bdc3c7' }}>
        Description
        <input
          value={form().description}
          data-testid="transaction-input-description"
          onInput={(e) => setForm({ ...form(), description: e.currentTarget.value })}
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        />
      </label>
      <label style={{ display: 'block', margin: '10px 0', color: '#bdc3c7' }}>
        Memo
        <input
          value={form().memo}
          data-testid="transaction-input-memo"
          onInput={(e) => setForm({ ...form(), memo: e.currentTarget.value })}
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        />
      </label>
      <label style={{ display: 'block', margin: '10px 0', color: '#bdc3c7' }}>
        Amount Debit
        <input
          value={form().amount_debit}
          disabled={!isDebit()}
          data-testid="transaction-input-amount_debit"
          onInput={(e) => setForm({ ...form(), amount_debit: e.currentTarget.value })}
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        />
      </label>
      <label style={{ display: 'block', margin: '10px 0', color: '#bdc3c7' }}>
        Amount Credit
        <input
          value={form().amount_credit}
          disabled={isDebit()}
          data-testid="transaction-input-amount_credit"
          onInput={(e) => setForm({ ...form(), amount_credit: e.currentTarget.value })}
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        />
      </label>
      <button
        type="button"
        data-testid="transaction-submit-button"
        onClick={saveTransaction}
        disabled={createMut.isPending}
      >
        {createMut.isPending ? 'Creating…' : 'Create Transaction'}
      </button>
    </div>
  )
}
