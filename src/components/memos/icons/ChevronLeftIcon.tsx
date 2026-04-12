import type { JSX } from 'solid-js'

export function ChevronLeftIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}
