import type { Accessor } from 'solid-js'
import { For } from 'solid-js'
import {
  MEMOS_TABLE_SORTABLE_COLUMNS,
  type MemosTableSortDir,
  type MemosTableSortKey,
} from '@components/memos/table/memosTableSort'
import MemosTableRow from '@components/memos/table/MemosTableRow'
import MemosTableSortIcon from '@components/memos/table/MemosTableSortIcon'
import type { Memo } from '@types'

export default function MemosTableDataTable(props: {
  paginatedData: Accessor<Memo[]>
  sortKey: Accessor<MemosTableSortKey | null>
  sortDir: Accessor<MemosTableSortDir>
  onSort: (key: MemosTableSortKey) => void
  togglingAmbiguousId: Accessor<number | null>
  mutatingCategoryId: Accessor<number | null>
  onToggleAmbiguous: (memo: Memo) => void
  onAssignCategory: (memo: Memo) => void
  getColorByName: (categoryName: string) => string
}) {
  return (
    <div class="overflow-x-auto">
      <table data-testid="memos-table" class="w-full border-collapse text-foreground text-sm">
        <thead>
          <tr class="border-b border-border">
            <For each={MEMOS_TABLE_SORTABLE_COLUMNS}>
              {(col) => (
                <th class="px-3 py-2.5 text-left" scope="col" data-testid={`column-${col.key}`}>
                  <button
                    type="button"
                    class="flex w-full min-w-0 items-center gap-1 rounded-sm text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none border-none bg-transparent p-0 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={() => props.onSort(col.key)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <MemosTableSortIcon columnKey={col.key} sortKey={props.sortKey} sortDir={props.sortDir} />
                  </button>
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.paginatedData()}>
            {(row) => (
              <MemosTableRow
                row={row}
                togglingAmbiguousId={props.togglingAmbiguousId}
                mutatingCategoryId={props.mutatingCategoryId}
                onToggleAmbiguous={props.onToggleAmbiguous}
                onAssignCategory={props.onAssignCategory}
                getColorByName={props.getColorByName}
              />
            )}
          </For>
        </tbody>
      </table>
    </div>
  )
}
