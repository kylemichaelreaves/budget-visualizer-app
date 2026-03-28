import type { JSX } from 'solid-js'
import { For, Show, createRenderEffect } from 'solid-js'
import { createStore } from 'solid-js/store'
import useTimeframeTypeAndValue from '@api/hooks/timeUnits/useTimeframeTypeAndValue'
import mutateMemo from '@api/hooks/memos/mutateMemo'
import AlertComponent from '@components/shared/AlertComponent'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import type { Frequency, Memo } from '@types'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'

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
  { value: '', label: '\u2014' },
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
    id: 0,
    name: '',
    recurring: false,
    necessary: false,
    ambiguous: false,
    frequency: '',
    budget_category: null,
  })

  createRenderEffect(() => {
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
      class="flex flex-col gap-3.5 max-w-[480px]"
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

      <div class="space-y-1">
        <Label class="text-muted-foreground text-sm">Name</Label>
        <Input
          data-testid={`${tid()}-name`}
          value={form.name}
          onInput={(e) => setForm('name', e.currentTarget.value)}
          required
        />
      </div>

      <Label class="flex items-center gap-2 text-foreground">
        <input
          type="checkbox"
          data-testid={`${tid()}-recurring`}
          checked={form.recurring}
          onChange={(e) => setForm('recurring', e.currentTarget.checked)}
        />
        Recurring
      </Label>

      <Label class="flex items-center gap-2 text-foreground">
        <input
          type="checkbox"
          data-testid={`${tid()}-necessary`}
          checked={form.necessary}
          onChange={(e) => setForm('necessary', e.currentTarget.checked)}
        />
        Necessary
      </Label>

      <Label class="flex items-center gap-2 text-foreground">
        <input
          type="checkbox"
          data-testid={`${tid()}-ambiguous`}
          checked={form.ambiguous}
          onChange={(e) => setForm('ambiguous', e.currentTarget.checked)}
        />
        Ambiguous
      </Label>

      <div class="space-y-1">
        <Label class="text-muted-foreground text-sm">Frequency</Label>
        <select
          data-testid={`${tid()}-frequency`}
          value={form.frequency}
          onChange={(e) => setForm('frequency', e.currentTarget.value as Frequency | '')}
          class="block w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          <For each={frequencyOptions}>{(opt) => <option value={opt.value}>{opt.label}</option>}</For>
        </select>
      </div>

      <div class="space-y-1">
        <Label class="text-muted-foreground text-sm">Budget category</Label>
        <div class="mt-1">
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

      <div class="flex gap-2.5 mt-2">
        <Button type="submit" disabled={mutation.isPending} data-testid={`${tid()}-submit`}>
          {mutation.isPending ? 'Saving\u2026' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
