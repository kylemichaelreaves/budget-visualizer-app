import type { JSX } from 'solid-js'
import { For, Show, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import AlertComponent from '@components/shared/AlertComponent'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import type { Frequency, Memo } from '@types'

type FormState = {
  id: number
  name: string
  recurring: boolean
  necessary: boolean
  ambiguous: boolean
  frequency: Frequency | ''
  budget_category: string | null
}

const frequencyOptions: { value: Frequency | ''; label: string }[] = [
  { value: '', label: '—' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export default function MemoEditForm(props: {
  memo: Memo
  onSuccess?: () => void
  dataTestId?: string
}): JSX.Element {
  const tid = () => props.dataTestId ?? 'memo-edit-form'
  const [form, setForm] = createStore<FormState>({
    id: props.memo.id,
    name: props.memo.name,
    recurring: props.memo.recurring,
    necessary: props.memo.necessary,
    ambiguous: props.memo.ambiguous,
    frequency: props.memo.frequency ?? '',
    budget_category: props.memo.budget_category ?? null,
  })

  createEffect(() => {
    const m = props.memo
    setForm({
      id: m.id,
      name: m.name,
      recurring: m.recurring,
      necessary: m.necessary,
      ambiguous: m.ambiguous,
      frequency: m.frequency ?? '',
      budget_category: m.budget_category ?? null,
    })
  })

  const mutation = mutateMemo()
  const { timeFrame, selectedValue } = useTimeframeTypeAndValue()

  function save() {
    const name = form.name.trim()
    if (!name) return
    mutation.mutate(
      {
        id: form.id,
        name,
        recurring: form.recurring,
        necessary: form.necessary,
        ambiguous: form.ambiguous,
        frequency: form.frequency || undefined,
        budget_category: form.budget_category || null,
      },
      { onSuccess: () => props.onSuccess?.() },
    )
  }

  return (
    <form
      data-testid={tid()}
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      style={{ display: 'flex', 'flex-direction': 'column', gap: '14px', 'max-width': '480px' }}
    >
      <Show when={mutation.isError && mutation.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId={`${tid()}-error`}
          />
        )}
      </Show>

      <label style={{ color: '#bdc3c7', 'font-size': '0.9rem' }}>
        Name
        <input
          data-testid={`${tid()}-name`}
          value={form.name}
          onInput={(e) => setForm('name', e.currentTarget.value)}
          required
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        />
      </label>

      <label style={{ display: 'flex', 'align-items': 'center', gap: '8px', color: '#ecf0f1' }}>
        <input
          type="checkbox"
          data-testid={`${tid()}-recurring`}
          checked={form.recurring}
          onChange={(e) => setForm('recurring', e.currentTarget.checked)}
        />
        Recurring
      </label>

      <label style={{ display: 'flex', 'align-items': 'center', gap: '8px', color: '#ecf0f1' }}>
        <input
          type="checkbox"
          data-testid={`${tid()}-necessary`}
          checked={form.necessary}
          onChange={(e) => setForm('necessary', e.currentTarget.checked)}
        />
        Necessary
      </label>

      <label style={{ display: 'flex', 'align-items': 'center', gap: '8px', color: '#ecf0f1' }}>
        <input
          type="checkbox"
          data-testid={`${tid()}-ambiguous`}
          checked={form.ambiguous}
          onChange={(e) => setForm('ambiguous', e.currentTarget.checked)}
        />
        Ambiguous
      </label>

      <label style={{ color: '#bdc3c7', 'font-size': '0.9rem' }}>
        Frequency
        <select
          data-testid={`${tid()}-frequency`}
          value={form.frequency}
          onChange={(e) => setForm('frequency', e.currentTarget.value as Frequency | '')}
          style={{ display: 'block', width: '100%', 'margin-top': '4px', padding: '8px' }}
        >
          <For each={frequencyOptions}>{(opt) => <option value={opt.value}>{opt.label}</option>}</For>
        </select>
      </label>

      <div>
        <span style={{ color: '#bdc3c7', 'font-size': '0.9rem' }}>Budget category</span>
        <div style={{ 'margin-top': '4px' }}>
          <BudgetCategoriesTreeSelect
            value={form.budget_category}
            onChange={(v) => setForm('budget_category', v)}
            dataTestId={`${tid()}-budget-category`}
            timeframe={() => timeFrame()}
            date={() => selectedValue()}
            filterable
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', 'margin-top': '8px' }}>
        <button type="submit" disabled={mutation.isPending} data-testid={`${tid()}-submit`}>
          {mutation.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}
