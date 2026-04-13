import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import TableSkeleton from '@components/shared/TableSkeleton'
import MemosTableDataTable from '@components/memos/MemosTableDataTable'
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card'
import { Input } from '@components/ui/input'
import {
  MEMOS_TABLE_SORTABLE_COLUMNS,
  type MemosTableSortDir,
  type MemosTableSortKey,
} from '@components/memos/memosTableSort'
import { SearchIcon } from '@shared/icons'
import type { Memo } from '@types'

export default function MemosTableListCard(props: {
  searchQuery: Accessor<string>
  setSearchQuery: (v: string) => void
  isLoadingCondition: Accessor<boolean>
  limit: Accessor<number>
  paginatedData: Accessor<Memo[]>
  sortKey: Accessor<MemosTableSortKey | null>
  sortDir: Accessor<MemosTableSortDir>
  onSort: (key: MemosTableSortKey) => void
  togglingAmbiguousId: Accessor<number | null>
  mutatingCategoryId: Accessor<number | null>
  onToggleAmbiguous: (memo: Memo) => void
  onAssignCategory: (memo: Memo) => void
}) {
  return (
    <Card>
      <CardHeader class="border-b">
        <div class="flex items-center justify-between gap-4">
          <CardTitle class="text-lg">All Memos</CardTitle>
          <div class="relative w-64">
            <span class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon class="size-4" />
            </span>
            <Input
              type="text"
              placeholder="Search memos..."
              value={props.searchQuery()}
              onInput={(e) => props.setSearchQuery(e.currentTarget.value)}
              class="pl-9"
              data-testid="memos-search-input"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Show when={props.isLoadingCondition()}>
          <TableSkeleton
            columns={MEMOS_TABLE_SORTABLE_COLUMNS.map((c) => ({ prop: c.key, label: c.label }))}
            rows={props.limit()}
            dataTestId="memos-table-skeleton"
          />
        </Show>

        <Show when={!props.isLoadingCondition() && props.paginatedData().length > 0}>
          <MemosTableDataTable
            paginatedData={props.paginatedData}
            sortKey={props.sortKey}
            sortDir={props.sortDir}
            onSort={props.onSort}
            togglingAmbiguousId={props.togglingAmbiguousId}
            mutatingCategoryId={props.mutatingCategoryId}
            onToggleAmbiguous={props.onToggleAmbiguous}
            onAssignCategory={props.onAssignCategory}
          />
        </Show>

        <Show when={!props.isLoadingCondition() && props.paginatedData().length === 0}>
          <p class="text-muted-foreground py-8 text-center">No memos found.</p>
        </Show>
      </CardContent>
    </Card>
  )
}
