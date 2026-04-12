import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@components/memos/memosTableIcons'
import type { MemosTableSortDir, MemosTableSortKey } from '@components/memos/memosTableSort'

export default function MemosTableSortIcon(props: {
  columnKey: MemosTableSortKey
  sortKey: Accessor<MemosTableSortKey | null>
  sortDir: Accessor<MemosTableSortDir>
}) {
  return (
    <Show when={props.sortKey() === props.columnKey} fallback={<ChevronUpDownIcon />}>
      {props.sortDir() === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />}
    </Show>
  )
}
