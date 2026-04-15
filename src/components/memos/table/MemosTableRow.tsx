import { A } from '@solidjs/router'
import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import type { Memo } from '@types'
import { AssignCategoryTrigger, BudgetCategoryPill } from '@components/shared/BudgetCategoryUi'
import { Skeleton } from '@components/ui/skeleton'
import { CheckIcon, WarningIcon } from '@shared/icons'
import { getMemosTableCategoryColor } from '@components/memos/table/memosTableSort'
import { formatUsdOrDash } from '@utils/formatUsd'

export default function MemosTableRow(props: {
  row: Memo
  togglingAmbiguousId: Accessor<number | null>
  mutatingCategoryId: Accessor<number | null>
  onToggleAmbiguous: (memo: Memo) => void
  onAssignCategory: (memo: Memo) => void
}) {
  const row = () => props.row

  return (
    <tr class="border-b border-border hover:bg-muted/50 transition-colors">
      <td class="px-3 py-2.5" data-testid={`cell-${row().id}-name`}>
        <A
          href={`/budget-visualizer/memos/${row().id}/summary`}
          class="text-primary hover:underline font-medium"
          data-testid={`memo-name-link-${row().id}`}
        >
          {row().name}
        </A>
      </td>

      <td class="px-3 py-2.5 text-muted-foreground" data-testid={`cell-${row().id}-transactions_count`}>
        {row().transactions_count ?? 0}
      </td>

      <td class="px-3 py-2.5" data-testid={`cell-${row().id}-ambiguous`}>
        <button
          type="button"
          disabled={props.togglingAmbiguousId() === row().id}
          class={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            row().ambiguous
              ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300 dark:hover:bg-amber-900/70'
              : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300 dark:hover:bg-green-900/70'
          }`}
          onClick={() => void props.onToggleAmbiguous(row())}
          data-testid={`ambiguous-toggle-${row().id}`}
        >
          <Show
            when={row().ambiguous}
            fallback={
              <>
                <CheckIcon class="size-3.5" /> No
              </>
            }
          >
            <WarningIcon class="size-3.5" /> Yes
          </Show>
        </button>
      </td>

      <td class="px-3 py-2.5" data-testid={`cell-${row().id}-budget_category`}>
        <Show
          when={props.mutatingCategoryId() !== row().id}
          fallback={<Skeleton class="h-6 w-24 rounded-full" />}
        >
          <Show
            when={row().budget_category}
            fallback={
              <AssignCategoryTrigger
                onClick={() => props.onAssignCategory(row())}
                dataTestId={`assign-category-${row().id}`}
                class="h-7 py-0"
              />
            }
          >
            <BudgetCategoryPill
              interactive
              label={row().budget_category!}
              class={`rounded-full border-0 px-2.5 py-0.5 font-medium ${getMemosTableCategoryColor(row().budget_category!)}`}
              onClick={() => props.onAssignCategory(row())}
              dataTestId={`category-badge-${row().id}`}
              buttonClass="rounded-full"
            />
          </Show>
        </Show>
      </td>

      <td
        class="px-3 py-2.5 text-red-600 dark:text-red-400 font-medium tabular-nums"
        data-testid={`cell-${row().id}-total_amount_debit`}
      >
        {formatUsdOrDash(row().total_amount_debit)}
      </td>
    </tr>
  )
}
