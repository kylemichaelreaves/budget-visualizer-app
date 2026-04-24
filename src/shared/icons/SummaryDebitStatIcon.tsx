import type { JSX } from 'solid-js'

export function SummaryDebitStatIcon(props: { class?: string }): JSX.Element {
  return (
    <svg
      class={props.class ?? 'size-4 text-negative'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="8 12 12 16 16 12" />
      <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
  )
}
