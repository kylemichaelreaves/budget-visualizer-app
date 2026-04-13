import type { Accessor } from 'solid-js'
import { For, Show } from 'solid-js'
import { Card, CardContent } from '@components/ui/card'
import { LayoutGridIcon } from '@shared/icons'
import { MEMO_SUMMARY_FREQUENCY_OPTIONS } from '@components/memos/memoSummaryConstants'

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
    <Card>
      <CardContent class="pt-5 pb-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="rounded-full bg-violet-100 dark:bg-violet-900/40 p-2">
            <LayoutGridIcon class="size-5 text-violet-600 dark:text-violet-400" />
          </div>
          <span class="text-sm font-medium text-muted-foreground">Budget Category</span>
        </div>

        <div class="mb-3">
          <Show
            when={props.budgetCategory()}
            fallback={
              <button
                type="button"
                disabled={!props.memoReady() || props.saving()}
                onClick={() => props.onOpenCategoryDialog()}
                class="text-sm text-muted-foreground hover:text-foreground border border-dashed border-border rounded-full px-3 py-1 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                + Assign category
              </button>
            }
          >
            <button
              type="button"
              disabled={!props.memoReady() || props.saving()}
              onClick={() => props.onOpenCategoryDialog()}
              class="inline-flex items-center rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-3 py-1 text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/60 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            >
              {props.budgetCategory()}
            </button>
          </Show>
        </div>

        <div class="space-y-2">
          <label
            class="flex items-center gap-2 text-sm"
            classList={{
              'cursor-pointer': props.memoReady(),
              'cursor-not-allowed opacity-60': !props.memoReady(),
            }}
          >
            <input
              type="checkbox"
              checked={props.isAmbiguous()}
              disabled={!props.memoReady() || props.saving()}
              onChange={(e) => props.onAmbiguousChange(e.currentTarget.checked)}
              class="rounded border-border accent-amber-500"
            />
            <span>Ambiguous category</span>
          </label>

          <label
            class="flex items-center gap-2 text-sm"
            classList={{
              'cursor-pointer': props.memoReady(),
              'cursor-not-allowed opacity-60': !props.memoReady(),
            }}
          >
            <input
              type="checkbox"
              checked={props.isRecurring()}
              disabled={!props.memoReady() || props.saving()}
              onChange={(e) => props.onRecurringChange(e.currentTarget.checked)}
              class="rounded border-border accent-blue-500"
            />
            <span>Recurring</span>
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
          </label>

          <label
            class="flex items-center gap-2 text-sm"
            classList={{
              'cursor-pointer': props.memoReady(),
              'cursor-not-allowed opacity-60': !props.memoReady(),
            }}
          >
            <input
              type="checkbox"
              checked={props.isNecessary()}
              disabled={!props.memoReady() || props.saving()}
              onChange={(e) => props.onNecessaryChange(e.currentTarget.checked)}
              class="rounded border-border accent-green-500"
            />
            <span>Necessary purchase</span>
          </label>
        </div>
      </CardContent>
    </Card>
  )
}
