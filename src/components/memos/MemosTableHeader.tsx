import type { JSX } from 'solid-js'
import { TableHead, TableHeader, TableRow } from '@components/ui/table'
import SortIcon from '@components/shared/SortIcon'
import type { SortDir } from '@components/shared/SortIcon'

export type MemoSortKey = 'name' | 'ambiguous' | 'budget_category' | 'total_amount_debit'

export default function MemosTableHeader(props: {
  sortKey: MemoSortKey
  sortDir: SortDir
  onToggleSort: (key: MemoSortKey) => void
}): JSX.Element {
  return (
    <TableHeader>
      <TableRow class="bg-muted/40">
        <TableHead class="px-4 py-3">
          <button
            onClick={() => props.onToggleSort('name')}
            class="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
          >
            Memo <SortIcon active={props.sortKey === 'name'} dir={props.sortDir} />
          </button>
        </TableHead>
        <TableHead class="px-4 py-3">
          <span class="font-medium">Tx Count</span>
        </TableHead>
        <TableHead class="px-4 py-3">
          <button
            onClick={() => props.onToggleSort('ambiguous')}
            class="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
          >
            Ambiguous <SortIcon active={props.sortKey === 'ambiguous'} dir={props.sortDir} />
          </button>
        </TableHead>
        <TableHead class="px-4 py-3">
          <button
            onClick={() => props.onToggleSort('budget_category')}
            class="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors"
          >
            Budget Category <SortIcon active={props.sortKey === 'budget_category'} dir={props.sortDir} />
          </button>
        </TableHead>
        <TableHead class="px-4 py-3 text-right">
          <button
            onClick={() => props.onToggleSort('total_amount_debit')}
            class="flex items-center gap-1.5 font-medium hover:text-foreground transition-colors ml-auto"
          >
            Total Debit <SortIcon active={props.sortKey === 'total_amount_debit'} dir={props.sortDir} />
          </button>
        </TableHead>
        <TableHead class="px-4 py-3">
          <span class="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}
