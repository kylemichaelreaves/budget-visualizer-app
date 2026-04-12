import type { JSX } from 'solid-js'

export function ChevronRightIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}

export function ChevronDownIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function FolderTreeIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-1.9-2.2a1 1 0 0 0-.8-.4H9a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z" />
      <path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.88-.55H9a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1Z" />
      <path d="M3 5a2 2 0 0 0 2 2h3" />
      <path d="M3 3v13a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

export function PlusIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  )
}

export function RefreshCwIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-3.5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 3" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 21" />
      <path d="M8 16H3v5" />
    </svg>
  )
}

export function PencilIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
    </svg>
  )
}

export function TrashIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  )
}

export function CheckIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function XIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

export function DotIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
