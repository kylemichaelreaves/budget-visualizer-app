import type { JSX } from 'solid-js'

export function SearchIcon(props: { class?: string }): JSX.Element {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}
