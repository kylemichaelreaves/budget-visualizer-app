import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import { AssignBudgetCategoryButton, BudgetCategoryPill } from '@components/shared/BudgetCategoryPill'
import { LayoutGridIcon } from '@shared/icons'
import { FREQUENCY_VALUES, NOT_RECURRING_VALUE } from '@components/memos/memoRecurrence'
import MemoSummaryCheckboxRow from './MemoSummaryCheckboxRow'
import MemoSummaryStatCard from './MemoSummaryStatCard'

export default function MemoSummaryStatCardBudget(props: {
  budgetCategory: Accessor<string | null>
  memoReady: Accessor<boolean>
  saving: Accessor<boolean>
  onOpenCategoryDialog: () => void
  onAmbiguousChange: (checked: boolean) => void
  onNecessaryChange: (checked: boolean) => void
  onFrequencyChange: (value: string) => void
  isAmbiguous: Accessor<boolean>
  isNecessary: Accessor<boolean>
  frequency: Accessor<string | undefined>
}) {
  const isDisabled = () => !props.memoReady() || props.saving()

  return (
    <MemoSummaryStatCard
      mode="custom"
      tone="violet"
      label={() => 'Budget Category'}
      icon={<LayoutGridIcon class="size-5 text-accent-purple" />}
    >
      <>
        <div class="mb-3">
          <Show
            when={props.budgetCategory()}
            fallback={
              <AssignBudgetCategoryButton
                showIcon={false}
                label="+ Assign category"
                disabled={isDisabled()}
                onClick={() => props.onOpenCategoryDialog()}
                dataTestId="memo-summary-assign-category"
                class="text-sm text-muted-foreground hover:text-foreground border-border"
              />
            }
          >
            <BudgetCategoryPill
              interactive
              disabled={isDisabled()}
              label={props.budgetCategory()!}
              dataTestId="memo-summary-budget-category-badge"
              onClick={() => props.onOpenCategoryDialog()}
              class="text-sm font-medium border-0 bg-accent-purple-muted text-accent-purple-foreground px-3 py-1"
              buttonClass="rounded-full hover:brightness-110 dark:hover:brightness-125 transition-colors"
            />
          </Show>
        </div>

        <div class="space-y-2">
          <MemoSummaryCheckboxRow
            label="Ambiguous"
            checked={props.isAmbiguous()}
            disabled={isDisabled()}
            onChange={props.onAmbiguousChange}
            accentClass="accent-caution"
          />

          {/*
            The interval is the only recurrence control. A memo is recurring
            exactly when it has one, so there is no separate checkbox that could
            disagree with the dropdown and send a pair the database rejects.
          */}
          <label
            class="flex items-center gap-2 text-sm"
            classList={{ 'cursor-not-allowed opacity-60': isDisabled() }}
          >
            <span>Recurring</span>
            <select
              data-testid="memo-summary-frequency"
              value={props.frequency() ?? NOT_RECURRING_VALUE}
              onChange={(e) => props.onFrequencyChange(e.currentTarget.value)}
              disabled={isDisabled()}
              class="ml-1 text-xs border border-input rounded px-1.5 py-0.5 bg-background"
            >
              <option value={NOT_RECURRING_VALUE}>not recurring</option>
              <For each={FREQUENCY_VALUES}>{(f) => <option value={f}>{f}</option>}</For>
            </select>
          </label>

          <MemoSummaryCheckboxRow
            label="Necessary purchase"
            checked={props.isNecessary()}
            disabled={isDisabled()}
            onChange={props.onNecessaryChange}
            accentClass="accent-positive"
          />
        </div>
      </>
    </MemoSummaryStatCard>
  )
}
