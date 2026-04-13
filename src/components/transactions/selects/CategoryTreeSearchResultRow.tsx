import type { JSX } from 'solid-js'
import { Show } from 'solid-js'
import { CheckIcon } from '@shared/icons'

export default function CategoryTreeSearchResultRow(props: {
  value: string
  label: string
  breadcrumb: string[]
  selected: boolean
  highlighted: boolean
  onSelect: () => void
  onHighlight: () => void
}): JSX.Element {
  return (
    <button
      type="button"
      aria-current={props.selected ? 'true' : undefined}
      onClick={() => props.onSelect()}
      onMouseEnter={() => props.onHighlight()}
      data-highlight={props.highlighted}
      class={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
        props.highlighted
          ? 'bg-accent text-accent-foreground'
          : props.selected
            ? 'bg-primary/10 text-primary font-medium'
            : ''
      }`}
    >
      <Show when={props.breadcrumb.length > 0}>
        <span class="text-xs text-muted-foreground">
          {props.breadcrumb.join(' \u203A ')} {'\u203A'}{' '}
        </span>
      </Show>
      {props.label}
      <Show when={props.selected}>
        <CheckIcon class="size-3.5 inline ml-1.5 text-primary" />
      </Show>
    </button>
  )
}
