import type { JSX } from 'solid-js'
import { For, Show } from 'solid-js'
import AlertComponent from '@components/shared/AlertComponent'
import BudgetCategoriesTreeSelect from '@components/transactions/selects/BudgetCategoriesTreeSelect'
import type { Memo } from '@types'
import { Button } from '@components/ui/button'
import { Input } from '@components/ui/input'
import { Label } from '@components/ui/label'
import { MEMO_EDIT_FREQUENCY_OPTIONS } from './memoEditFormUtils'
import { useMemoEditForm } from './useMemoEditForm'

export default function MemoEditForm(props: {
  memo: Memo
  onSuccess?: () => void
  dataTestId?: string
}): JSX.Element {
  const state = useMemoEditForm(props)

  return (
    <form
      data-testid={state.tid()}
      onSubmit={(e) => {
        e.preventDefault()
        state.save()
      }}
      class="flex flex-col gap-3.5 max-w-[480px]"
    >
      <Show when={state.mutation.isError && state.mutation.error}>
        {(err) => (
          <AlertComponent
            type="error"
            title={(err() as Error).name}
            message={(err() as Error).message}
            dataTestId={`${state.tid()}-error`}
          />
        )}
      </Show>

      <div class="space-y-1">
        <Label for="memo-name" class="text-muted-foreground text-sm">
          Name
        </Label>
        <Input
          id="memo-name"
          data-testid={`${state.tid()}-name`}
          value={state.form.name}
          onInput={(e) => state.setForm('name', e.currentTarget.value)}
          required
        />
      </div>

      <Label class="flex items-center gap-2 text-foreground">
        <input
          id="memo-recurring"
          type="checkbox"
          data-testid={`${state.tid()}-recurring`}
          checked={state.form.recurring}
          onChange={(e) => state.setForm('recurring', e.currentTarget.checked)}
        />
        Recurring
      </Label>

      <Label class="flex items-center gap-2 text-foreground">
        <input
          id="memo-necessary"
          type="checkbox"
          data-testid={`${state.tid()}-necessary`}
          checked={state.form.necessary}
          onChange={(e) => state.setForm('necessary', e.currentTarget.checked)}
        />
        Necessary
      </Label>

      <Label class="flex items-center gap-2 text-foreground">
        <input
          id="memo-ambiguous"
          type="checkbox"
          data-testid={`${state.tid()}-ambiguous`}
          checked={state.form.ambiguous}
          onChange={(e) => state.setForm('ambiguous', e.currentTarget.checked)}
        />
        Ambiguous
      </Label>

      <div class="space-y-1">
        <Label for="memo-frequency" class="text-muted-foreground text-sm">
          Frequency
        </Label>
        <select
          id="memo-frequency"
          data-testid={`${state.tid()}-frequency`}
          value={state.form.frequency}
          onChange={(e) => state.setForm('frequency', e.currentTarget.value as typeof state.form.frequency)}
          class="block w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
        >
          <For each={MEMO_EDIT_FREQUENCY_OPTIONS}>
            {(opt) => <option value={opt.value}>{opt.label}</option>}
          </For>
        </select>
      </div>

      <div class="space-y-1">
        <Label class="text-muted-foreground text-sm">Budget category</Label>
        <div class="mt-1">
          <BudgetCategoriesTreeSelect
            value={state.form.budget_category}
            onChange={(v) => state.setForm('budget_category', v)}
            dataTestId={`${state.tid()}-budget-category`}
            timeframe={() => state.timeFrame()}
            date={() => state.selectedValue()}
            filterable
          />
        </div>
      </div>

      <div class="flex gap-2.5 mt-2">
        <Button type="submit" disabled={state.mutation.isPending} data-testid={`${state.tid()}-submit`}>
          {state.mutation.isPending ? 'Saving\u2026' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
