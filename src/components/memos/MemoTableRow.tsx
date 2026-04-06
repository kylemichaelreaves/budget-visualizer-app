import { A } from '@solidjs/router'
import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import type { Memo } from '@types'
import { formatCurrency } from '@utils/formatCurrency'
import { TableCell, TableRow } from '@components/ui/table'
import AmbiguousBadge from '@components/shared/AmbiguousBadge'
import CategoryBadge from '@components/shared/CategoryBadge'

export default function MemoTableRow(props: {
  row: Memo
  getColorByName: (name: string) => string
  onAssignCategory: (memo: Memo) => void
}): JSX.Element {
  const row = props.row

  return (
    <TableRow>
      <TableCell class="px-4 py-3">
        <A
          href={`/budget-visualizer/memos/${row.id}/summary`}
          class="font-medium text-primary hover:underline underline-offset-2"
          data-testid={`memo-name-link-${row.id}`}
        >
          {row.name}
        </A>
      </TableCell>
      <TableCell class="px-4 py-3 text-muted-foreground">{row.transactions_count ?? '—'}</TableCell>
      <TableCell class="px-4 py-3">
        <AmbiguousBadge ambiguous={row.ambiguous} />
      </TableCell>
      <TableCell class="px-4 py-3">
        <Show
          when={row.budget_category}
          fallback={
            <button
              onClick={() => props.onAssignCategory(row)}
              class="inline-flex items-center gap-1.5 rounded-full border border-dashed px-2.5 py-1 text-xs transition-colors text-muted-foreground hover:border-solid hover:text-foreground cursor-pointer"
              data-testid={`memo-assign-category-${row.id}`}
            >
              <svg
                class="h-3 w-3 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              Assign category
            </button>
          }
        >
          <button
            onClick={() => props.onAssignCategory(row)}
            class="cursor-pointer"
            data-testid={`memo-change-category-${row.id}`}
          >
            <CategoryBadge category={String(row.budget_category)} getColorByName={props.getColorByName} />
          </button>
        </Show>
      </TableCell>
      <TableCell class="px-4 py-3 text-right font-medium tabular-nums">
        <Show
          when={(row.total_amount_debit ?? 0) > 0}
          fallback={<span class="text-muted-foreground">—</span>}
        >
          <span class="text-red-600 dark:text-red-500">-{formatCurrency(row.total_amount_debit)}</span>
        </Show>
      </TableCell>
      <TableCell class="px-4 py-3">
        <div class="flex gap-2 flex-wrap">
          <A
            href={`/budget-visualizer/memos/${row.id}/summary`}
            class="text-primary hover:underline underline-offset-2 text-sm"
            data-testid={`memo-summary-link-${row.id}`}
          >
            Summary
          </A>
          <A
            href={`/budget-visualizer/memos/${row.id}/edit`}
            class="text-primary hover:underline underline-offset-2 text-sm"
            data-testid={`memo-edit-link-${row.id}`}
          >
            Edit
          </A>
        </div>
      </TableCell>
    </TableRow>
  )
}
