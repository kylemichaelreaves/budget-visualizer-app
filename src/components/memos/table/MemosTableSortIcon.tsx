import type { Accessor } from 'solid-js'
import TableSortIcon from '@components/shared/TableSortIcon'
import type { MemosTableSortDir, MemosTableSortKey } from '@components/memos/table/memosTableSort'

export default function MemosTableSortIcon(props: {
  columnKey: MemosTableSortKey
  sortKey: Accessor<MemosTableSortKey | null>
  sortDir: Accessor<MemosTableSortDir>
}) {
  return <TableSortIcon active={props.sortKey() === props.columnKey} dir={props.sortDir()} class="size-3" />
}
