import type { JSX } from 'solid-js'

export function CheckCircleIcon(props: { class?: string }): JSX.Element {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  )
}
