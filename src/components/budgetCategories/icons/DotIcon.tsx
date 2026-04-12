import type { JSX } from 'solid-js'

export function DotIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
