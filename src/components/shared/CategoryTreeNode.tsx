import type { JSX } from 'solid-js'
import { createEffect, on, Show } from 'solid-js'
import { CheckIcon, ChevronDownIcon, ChevronRightIcon } from './CategoryTreeIcons'

export default function CategoryTreeNode(props: {
  label: string
  value: string
  depth: number
  hasChildren: boolean
  isOpen: boolean
  selected: boolean
  focused: boolean
  onToggle: (value: string) => void
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
      style={{ 'padding-left': `${props.depth * 18 + 10}px` }}
      onClick={() => {
        if (props.hasChildren) {
          props.onToggle(props.value)
        } else {
          props.onSelect(props.value)
        }
      }}
      role="option"
      aria-selected={props.selected}
      class={`w-full flex items-center gap-2 py-1.5 pr-3 rounded-md text-sm transition-colors hover:bg-accent text-left ${
        props.focused ? 'bg-accent' : ''
      } ${props.selected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
      tabIndex={-1}
    >
      <span class="shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground">
        {props.hasChildren ? (
          props.isOpen ? (
            <ChevronDownIcon />
          ) : (
            <ChevronRightIcon />
          )
        ) : (
          <span class="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 mx-auto" />
        )}
      </span>
      <span class="flex-1 truncate">{props.label}</span>
      <Show when={props.selected}>
        <CheckIcon class="h-3.5 w-3.5 shrink-0 text-primary" />
      </Show>
    </button>
  )
}
