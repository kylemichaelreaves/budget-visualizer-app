import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon } from '@shared/icons'

export type TableSortDir = 'asc' | 'desc'

export default function TableSortIcon(props: {
  active: boolean
  dir: TableSortDir
  class?: string
}): JSX.Element {
  const iconClass = () => {
    const base = props.class ?? 'size-3 shrink-0'
    return props.active ? `${base} text-primary` : `${base} opacity-40`
  }

  return (
    <Show when={props.active} fallback={<ChevronUpDownIcon class={iconClass()} />}>
      {props.dir === 'asc' ? <ChevronUpIcon class={iconClass()} /> : <ChevronDownIcon class={iconClass()} />}
    </Show>
  )
}
