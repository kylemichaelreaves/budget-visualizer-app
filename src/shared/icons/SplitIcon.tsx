import type { JSX } from 'solid-js'

/** Matches lucide-react's SplitSquareHorizontal icon — a square divided vertically. */
export function SplitIcon(props: { class?: string }): JSX.Element {
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
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M12 3v18" />
    </svg>
  )
}
