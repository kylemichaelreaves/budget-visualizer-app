import type { JSX } from 'solid-js'

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
