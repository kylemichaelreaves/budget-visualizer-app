import type { JSX } from 'solid-js'
import { createEffect, on, Show } from 'solid-js'
import { CheckIcon } from './CategoryTreeIcons'

export default function CategorySearchResult(props: {
  label: string
  value: string
  breadcrumb: string[]
  selected: boolean
  focused: boolean
  onSelect: (value: string) => void
}): JSX.Element {
  // eslint-disable-next-line no-unassigned-vars -- assigned via JSX ref
  let ref: HTMLButtonElement | undefined

  createEffect(
    on(
      () => props.focused,
      (f) => {
        if (f) ref?.scrollIntoView({ block: 'nearest' })
      },
    ),
  )

  return (
    <button
      ref={ref}
      onClick={() => props.onSelect(props.value)}
      role="option"
      aria-selected={props.selected}
      class={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors hover:bg-accent ${
        props.focused ? 'bg-accent' : ''
      } ${props.selected ? 'bg-primary/10 text-primary font-medium' : ''}`}
      tabIndex={-1}
    >
      <Show when={props.breadcrumb.length > 0}>
        <span class="text-xs text-muted-foreground">
          {props.breadcrumb.join(' > ')} {'> '}
        </span>
      </Show>
      {props.label}
      <Show when={props.selected}>
        <CheckIcon class="h-3.5 w-3.5 inline ml-1.5 text-primary" />
      </Show>
    </button>
  )
}
