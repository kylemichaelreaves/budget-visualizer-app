import type { JSX } from 'solid-js'

export type SortDir = 'asc' | 'desc'

export default function SortIcon(props: { active: boolean; dir: SortDir }): JSX.Element {
  if (!props.active) {
    return (
      <svg
        class="h-3.5 w-3.5 text-muted-foreground/50"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M7 15l5 5 5-5" />
        <path d="M7 9l5-5 5 5" />
      </svg>
    )
  }
  return props.dir === 'asc' ? (
    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 15l-6-6-6 6" />
    </svg>
  ) : (
    <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
