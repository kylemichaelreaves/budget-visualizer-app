import type { JSX } from '@solidjs/web'

export function DotIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'size-4'} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
