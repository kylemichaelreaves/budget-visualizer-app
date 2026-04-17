import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import { AssignBudgetCategoryButton, BudgetCategoryPill } from '@components/shared/BudgetCategoryPill'
import { LayoutGridIcon } from '@shared/icons'
import { MEMO_SUMMARY_FREQUENCY_OPTIONS } from './memoSummaryConstants'
import MemoSummaryCheckboxRow from './MemoSummaryCheckboxRow'
import MemoSummaryStatCard from './MemoSummaryStatCard'

export default function MemoSummaryStatCardBudget(props: {
  budgetCategory: Accessor<string | null>
  memoReady: Accessor<boolean>
  saving: Accessor<boolean>
  onOpenCategoryDialog: () => void
  onAmbiguousChange: (checked: boolean) => void
  onRecurringChange: (checked: boolean) => void
  onNecessaryChange: (checked: boolean) => void
  onFrequencyChange: (value: string) => void
  isAmbiguous: Accessor<boolean>
  isRecurring: Accessor<boolean>
  isNecessary: Accessor<boolean>
  frequency: Accessor<string | undefined>
}) {
  return (
    <MemoSummaryStatCard
      tone="violet"
      label={() => 'Budget Category'}
      icon={<LayoutGridIcon class="size-5 text-violet-600 dark:text-violet-400" />}
    >
      <>
        <div class="mb-3">
          <Show
            when={props.budgetCategory()}
            fallback={
              <AssignBudgetCategoryButton
                showIcon={false}
                label="+ Assign category"
                disabled={!props.memoReady() || props.saving()}
                onClick={() => props.onOpenCategoryDialog()}
                dataTestId="memo-summary-assign-category"
                class="text-sm text-muted-foreground hover:text-foreground border-border"
              />
            }
          >
            <BudgetCategoryPill
              interactive
              disabled={!props.memoReady() || props.saving()}
              label={props.budgetCategory()!}
              dataTestId="memo-summary-budget-category-badge"
              onClick={() => props.onOpenCategoryDialog()}
              class="text-sm font-medium border-0 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-3 py-1"
              buttonClass="rounded-full hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors"
            />
          </Show>
        </div>

        <div class="space-y-2">
          <MemoSummaryCheckboxRow
            label="Ambiguous category"
            checked={props.isAmbiguous()}
            disabled={!props.memoReady() || props.saving()}
            onChange={props.onAmbiguousChange}
            accentClass="accent-amber-500"
            memoReady={props.memoReady}
          />

          <MemoSummaryCheckboxRow
            label="Recurring"
            checked={props.isRecurring()}
            disabled={!props.memoReady() || props.saving()}
            onChange={props.onRecurringChange}
            accentClass="accent-blue-500"
            memoReady={props.memoReady}
            trailing={
              <Show when={props.isRecurring()}>
                <select
                  value={props.frequency() ?? ''}
                  onChange={(e) => props.onFrequencyChange(e.currentTarget.value)}
                  disabled={!props.memoReady() || props.saving()}
                  class="ml-1 text-xs border border-input rounded px-1.5 py-0.5 bg-background"
                  onClick={(e) => e.stopPropagation()}
                >
                  <option value="">interval...</option>
                  <For each={MEMO_SUMMARY_FREQUENCY_OPTIONS}>{(f) => <option value={f}>{f}</option>}</For>
                </select>
              </Show>
            }
          />

          <MemoSummaryCheckboxRow
            label="Necessary purchase"
            checked={props.isNecessary()}
            disabled={!props.memoReady() || props.saving()}
            onChange={props.onNecessaryChange}
            accentClass="accent-green-500"
            memoReady={props.memoReady}
          />
        </div>
      </>
    </MemoSummaryStatCard>
  )
}
