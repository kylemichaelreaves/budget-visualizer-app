import type { JSX } from 'solid-js'

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
} as const

export function CheckIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'h-3.5 w-3.5'} {...iconProps}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export function ChevronDownIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'h-3.5 w-3.5'} {...iconProps}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

export function ChevronRightIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'h-3.5 w-3.5'} {...iconProps}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

export function SearchIcon(props: { class?: string }): JSX.Element {
  return (
    <svg class={props.class ?? 'h-3.5 w-3.5'} {...iconProps}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  )
}
