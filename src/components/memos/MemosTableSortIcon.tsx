import type { Accessor } from 'solid-js'
import { Show } from 'solid-js'
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@shared/icons'
import type { MemosTableSortDir, MemosTableSortKey } from '@components/memos/memosTableSort'

export default function MemosTableSortIcon(props: {
  columnKey: MemosTableSortKey
  sortKey: Accessor<MemosTableSortKey | null>
  sortDir: Accessor<MemosTableSortDir>
}) {
  return (
    <Show when={props.sortKey() === props.columnKey} fallback={<ChevronUpDownIcon class="size-3" />}>
      {props.sortDir() === 'asc' ? <ChevronUpIcon class="size-3" /> : <ChevronDownIcon class="size-3" />}
    </Show>
  )
}
